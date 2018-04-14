"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("./util/log");
const contracts_1 = require("@machinomy/contracts");
const ChannelId_1 = require("./ChannelId");
const LOG = log_1.default('ChannelContract');
const CREATE_CHANNEL_GAS = 300000;
class ChannelContract {
    constructor(web3) {
        this.web3 = web3;
    }
    async open(sender, receiver, price, settlementPeriod, channelId) {
        LOG(`Creating channel. Value: ${price} / Settlement: ${settlementPeriod}`);
        let _channelId = channelId || ChannelId_1.default.random();
        const deployed = await this.contract();
        return deployed.open(_channelId.toString(), receiver, settlementPeriod, {
            from: sender,
            value: price,
            gas: CREATE_CHANNEL_GAS
        });
    }
    async claim(receiver, channelId, value, signature) {
        LOG(`Claiming channel with id ${channelId} on behalf of receiver ${receiver}`);
        LOG(`Values: ${value} / Signature: ${signature.toString()}`);
        const deployed = await this.contract();
        return deployed.claim(channelId, value, signature.toString(), { from: receiver });
    }
    async deposit(sender, channelId, value) {
        LOG(`Depositing ${value} into channel ${channelId}`);
        const deployed = await this.contract();
        return deployed.deposit(channelId, {
            from: sender,
            value: value,
            gas: CREATE_CHANNEL_GAS
        });
    }
    async getState(channelId) {
        LOG(`Fetching state for channel ${channelId}`);
        const deployed = await this.contract();
        const isOpen = await deployed.isOpen(channelId);
        const isSettling = await deployed.isSettling(channelId);
        if (isOpen) {
            return 0;
        }
        if (isSettling) {
            return 1;
        }
        return 2;
    }
    async getSettlementPeriod(channelId) {
        LOG(`Fetching settlement period for channel ${channelId}`);
        const deployed = await this.contract();
        const exists = await deployed.isPresent(channelId);
        if (!exists) {
            throw new Error(`Cannot fetch settlement period for non-existent channel ${channelId}.`);
        }
        const chan = await deployed.channels(channelId);
        return chan[3];
    }
    async startSettle(account, channelId) {
        LOG(`Starting settle for account ${account} and channel id ${channelId}.`);
        const deployed = await this.contract();
        return deployed.startSettling(channelId, { from: account });
    }
    async finishSettle(account, channelId) {
        LOG(`Finishing settle for account ${account} and channel ID ${channelId}.`);
        const deployed = await this.contract();
        return deployed.settle(channelId, { from: account, gas: 400000 });
    }
    async paymentDigest(channelId, value) {
        const deployed = await this.contract();
        return deployed.paymentDigest(channelId, value);
    }
    async canClaim(channelId, payment, receiver, signature) {
        const deployed = await this.contract();
        return deployed.canClaim(channelId, payment, receiver, signature.toString());
    }
    async channelById(channelId) {
        const deployed = await this.contract();
        return deployed.channels(channelId);
    }
    async contract() {
        if (!this._contract) {
            this._contract = process.env.CONTRACT_ADDRESS ?
                await contracts_1.Unidirectional.contract(this.web3.currentProvider).at(process.env.CONTRACT_ADDRESS) :
                await contracts_1.Unidirectional.contract(this.web3.currentProvider).deployed();
        }
        return this._contract;
    }
}
exports.default = ChannelContract;
//# sourceMappingURL=channel_contract.js.map