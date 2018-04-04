"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BigNumber = require("bignumber.js");
const payment_1 = require("./payment");
const channel_manager_1 = require("./channel_manager");
class PaymentManager {
    constructor(chainManager, channelContract, options) {
        this.chainManager = chainManager;
        this.channelContract = channelContract;
        this.options = options;
    }
    async buildPaymentForChannel(channel, price, totalValue, meta) {
        const digest = await this.channelContract.paymentDigest(channel.channelId, totalValue);
        const signature = await this.chainManager.sign(channel.sender, digest);
        return new payment_1.default({
            channelId: channel.channelId,
            sender: channel.sender,
            receiver: channel.receiver,
            price,
            value: totalValue,
            channelValue: channel.value,
            signature,
            meta,
            contractAddress: channel.contractAddress,
            token: undefined
        });
    }
    async isValid(payment, paymentChannel) {
        const validIncrement = paymentChannel.spent.plus(payment.price).equals(payment.value);
        const settlementPeriod = await this.channelContract.getSettlementPeriod(payment.channelId);
        const validChannelValue = paymentChannel.value.equals(payment.channelValue);
        const validChannelId = paymentChannel.channelId === payment.channelId;
        const validPaymentValue = paymentChannel.value.lessThanOrEqualTo(payment.channelValue);
        const validSender = paymentChannel.sender === payment.sender;
        const isPositive = payment.value.greaterThanOrEqualTo(new BigNumber.BigNumber(0)) && payment.price.greaterThanOrEqualTo(new BigNumber.BigNumber(0));
        const canClaim = await this.channelContract.canClaim(payment.channelId, payment.value, payment.receiver, payment.signature);
        const isAboveMinSettlementPeriod = new BigNumber.BigNumber(this.options.minimumSettlementPeriod || channel_manager_1.DEFAULT_SETTLEMENT_PERIOD)
            .lessThanOrEqualTo(settlementPeriod);
        console.log('Valid increment (using existing channel):', validIncrement, 'Valid channel value:', validChannelValue, 'Valid sender:', validSender, 'Valid channel ID:', validChannelId, 'Can claim:', canClaim, 'Is Positive:', isPositive, 'Is above minimum settlement period:', isAboveMinSettlementPeriod);
        return validIncrement &&
            validChannelValue &&
            validPaymentValue &&
            validSender &&
            validChannelId &&
            canClaim &&
            isPositive &&
            isAboveMinSettlementPeriod;
    }
}
exports.default = PaymentManager;
//# sourceMappingURL=payment_manager.js.map