"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BigNumber = require("bignumber.js");
const payment_channel_1 = require("./payment_channel");
const events_1 = require("events");
const mutex_1 = require("./util/mutex");
const log_1 = require("./util/log");
const LOG = log_1.default('ChannelManager');
const DAY_IN_SECONDS = 86400;
/** Default settlement period for a payment channel */
exports.DEFAULT_SETTLEMENT_PERIOD = 2 * DAY_IN_SECONDS;
class ChannelManagerImpl extends events_1.EventEmitter {
    constructor(account, web3, channelsDao, paymentsDao, tokensDao, channelContract, paymentManager, machinomyOptions) {
        super();
        this.mutex = new mutex_1.default();
        this.account = account;
        this.web3 = web3;
        this.channelsDao = channelsDao;
        this.paymentsDao = paymentsDao;
        this.tokensDao = tokensDao;
        this.channelContract = channelContract;
        this.paymentManager = paymentManager;
        this.machinomyOptions = machinomyOptions;
    }
    openChannel(sender, receiver, amount, minDepositAmount, channelId) {
        return this.mutex.synchronize(() => this.internalOpenChannel(sender, receiver, amount, minDepositAmount, channelId));
    }
    closeChannel(channelId) {
        return this.mutex.synchronize(() => this.internalCloseChannel(channelId));
    }
    deposit(channelId, value) {
        return this.mutex.synchronize(async () => {
            const channel = await this.channelById(channelId);
            if (!channel) {
                throw new Error('No payment channel found.');
            }
            const res = await this.channelContract.deposit(this.account, channelId, value);
            await this.channelsDao.deposit(channelId, value);
            return res;
        });
    }
    nextPayment(channelId, amount, meta) {
        return this.mutex.synchronize(async () => {
            const channel = await this.channelById(channelId);
            if (!channel) {
                throw new Error(`Channel with id ${channelId.toString()} not found.`);
            }
            const toSpend = channel.spent.add(amount);
            if (toSpend.greaterThan(channel.value)) {
                throw new Error(`Total spend ${toSpend.toString()} is larger than channel value ${channel.value.toString()}`);
            }
            return this.paymentManager.buildPaymentForChannel(channel, amount, toSpend, meta);
        });
    }
    async spendChannel(payment) {
        const chan = payment_channel_1.PaymentChannel.fromPayment(payment);
        await this.channelsDao.saveOrUpdate(chan);
        return payment;
    }
    acceptPayment(payment) {
        LOG(`Queueing payment of ${payment.price.toString()} Wei to channel with ID ${payment.channelId}.`);
        return this.mutex.synchronize(async () => {
            const channel = payment_channel_1.PaymentChannel.fromPayment(payment);
            LOG(`Adding ${payment.price.toString()} Wei to channel with ID ${channel.channelId.toString()}.`);
            const valid = await this.paymentManager.isValid(payment, channel);
            if (valid) {
                const token = this.web3.sha3(JSON.stringify(payment)).toString();
                await this.channelsDao.saveOrUpdate(channel);
                await this.tokensDao.save(token, payment.channelId);
                await this.paymentsDao.save(token, payment);
                return token;
            }
            if (this.machinomyOptions.closeOnInvalidPayment) {
                LOG(`Received invalid payment from ${payment.sender}!`);
                const existingChannel = await this.channelsDao.findBySenderReceiverChannelId(payment.sender, payment.receiver, payment.channelId);
                if (existingChannel) {
                    LOG(`Found existing channel with id ${payment.channelId} between ${payment.sender} and ${payment.receiver}.`);
                    LOG('Closing channel due to malfeasance.');
                    await this.internalCloseChannel(channel.channelId);
                }
            }
            throw new Error('Invalid payment.');
        });
    }
    requireOpenChannel(sender, receiver, amount, minDepositAmount) {
        return this.mutex.synchronize(async () => {
            if (!minDepositAmount && this.machinomyOptions && this.machinomyOptions.minimumChannelAmount) {
                minDepositAmount = new BigNumber.BigNumber(this.machinomyOptions.minimumChannelAmount);
            }
            let channel = await this.channelsDao.findUsable(sender, receiver, amount);
            return channel || this.internalOpenChannel(sender, receiver, amount, minDepositAmount);
        });
    }
    channels() {
        return this.channelsDao.all();
    }
    openChannels() {
        return this.channelsDao.allOpen();
    }
    settlingChannels() {
        return this.channelsDao.allSettling();
    }
    async channelById(channelId) {
        let channel = await this.channelsDao.firstById(channelId);
        if (channel) {
            let channelC = await this.channelContract.channelById(channelId.toString());
            channel.value = channelC[2];
            return channel;
        }
        else {
            return this.handleUnknownChannel(channelId);
        }
    }
    verifyToken(token) {
        return this.tokensDao.isPresent(token);
    }
    internalOpenChannel(sender, receiver, amount, minDepositAmount = new BigNumber.BigNumber(0), channelId) {
        let depositAmount = amount.times(10);
        if (minDepositAmount.greaterThan(0) && minDepositAmount.greaterThan(depositAmount)) {
            depositAmount = minDepositAmount;
        }
        this.emit('willOpenChannel', sender, receiver, depositAmount);
        return this.buildChannel(sender, receiver, depositAmount, this.machinomyOptions.settlementPeriod || exports.DEFAULT_SETTLEMENT_PERIOD, channelId)
            .then((paymentChannel) => this.channelsDao.save(paymentChannel).then(() => paymentChannel))
            .then((paymentChannel) => {
            this.emit('didOpenChannel', paymentChannel);
            return paymentChannel;
        });
    }
    async internalCloseChannel(channelId) {
        let channel = await this.channelById(channelId) || await this.handleUnknownChannel(channelId);
        if (!channel) {
            throw new Error(`Channel ${channelId} not found.`);
        }
        this.emit('willCloseChannel', channel);
        let res;
        if (channel.sender === this.account) {
            res = this.settle(channel);
        }
        else {
            res = this.claim(channel);
        }
        const txn = await res;
        this.emit('didCloseChannel', channel);
        return txn;
    }
    settle(channel) {
        return this.channelContract.getState(channel.channelId).then((state) => {
            if (state === 2) {
                throw new Error(`Channel ${channel.channelId.toString()} is already settled.`);
            }
            switch (state) {
                case 0:
                    return this.channelContract.startSettle(this.account, channel.channelId)
                        .then((res) => this.channelsDao.updateState(channel.channelId, 1).then(() => res));
                case 1:
                    return this.channelContract.finishSettle(this.account, channel.channelId)
                        .then((res) => this.channelsDao.updateState(channel.channelId, 2).then(() => res));
                default:
                    throw new Error(`Unknown state: ${state}`);
            }
        });
    }
    async claim(channel) {
        let payment = await this.paymentsDao.firstMaximum(channel.channelId);
        if (!payment) {
            throw new Error(`No payment found for channel ID ${channel.channelId.toString()}`);
        }
        let result = await this.channelContract.claim(channel.receiver, channel.channelId, payment.value, payment.signature);
        await this.channelsDao.updateState(channel.channelId, 2);
        return result;
    }
    async buildChannel(sender, receiver, price, settlementPeriod, channelId) {
        const res = await this.channelContract.open(sender, receiver, price, settlementPeriod, channelId);
        const _channelId = res.logs[0].args.channelId;
        return new payment_channel_1.PaymentChannel(sender, receiver, _channelId, price, new BigNumber.BigNumber(0), 0, undefined);
    }
    async handleUnknownChannel(channelId) {
        channelId = channelId.toString();
        // tslint:disable-next-line:no-unused-variable
        const [sender, receiver, value, settlingPeriod, settlingUntil] = await this.channelContract.channelById(channelId);
        if (sender !== this.account && receiver !== this.account) {
            return null;
        }
        const chan = new payment_channel_1.PaymentChannel(sender, receiver, channelId, value, new BigNumber.BigNumber(0), settlingUntil.eq(0) ? 0 : 1, undefined);
        await this.channelsDao.save(chan);
        return chan;
    }
}
exports.ChannelManagerImpl = ChannelManagerImpl;
//# sourceMappingURL=channel_manager.js.map