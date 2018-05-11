"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BigNumber = require("bignumber.js");
const log_1 = require("./util/log");
const channel_manager_1 = require("./channel_manager");
const LOG = log_1.default('PaymentValidation');
function error(message, ...args) {
    LOG(`Payment is invalid: ${message}`, args);
}
class PaymentValidation {
    constructor(channelContract, payment, paymentChannel, options) {
        this.payment = payment;
        this.paymentChannel = paymentChannel;
        this.channelContract = channelContract;
        this.options = options;
    }
    async isValid() {
        return this.isValidIncrement() &&
            this.isValidChannelValue() &&
            this.isValidChannelId() &&
            this.isValidPaymentValue() &&
            this.isValidSender() &&
            this.isPositive() &&
            this.canClaim() &&
            this.isAboveMinSettlementPeriod();
    }
    async isValidIncrement() {
        const isValidIncrement = this.paymentChannel.spent.plus(this.payment.price).equals(this.payment.value);
        if (!isValidIncrement) {
            error(`Price increment is too large. Payment channel already spent: ${this.paymentChannel.spent}, payment: %o`, this.payment);
        }
        return isValidIncrement;
    }
    async isValidChannelValue() {
        const isValidChannelValue = this.paymentChannel.value.equals(this.payment.channelValue);
        if (!isValidChannelValue) {
            error(`Payment value does not match payment channel value. payment channel value: ${this.paymentChannel.value}, payment: %o`, this.payment);
        }
        return isValidChannelValue;
    }
    async isValidChannelId() {
        const isValidChannelId = this.paymentChannel.channelId === this.payment.channelId;
        if (!isValidChannelId) {
            error(`Channel Id does not match. expected: ${this.paymentChannel.channelId}, payment: %o`, this.payment);
        }
        return isValidChannelId;
    }
    async isValidPaymentValue() {
        const isValidPaymentValue = this.paymentChannel.value.lessThanOrEqualTo(this.payment.channelValue);
        if (!isValidPaymentValue) {
            error(`Payment value exceeds the channel value. Channel value: ${this.paymentChannel.value}, payment: %o`, this.payment);
        }
        return isValidPaymentValue;
    }
    async isValidSender() {
        const isValidSender = this.paymentChannel.sender === this.payment.sender;
        if (!isValidSender) {
            error(`Sender does not match. Channel sender: ${this.paymentChannel.sender}, payment: %o`, this.payment);
        }
        return isValidSender;
    }
    async isPositive() {
        const isPositive = this.payment.value.greaterThanOrEqualTo(0) && this.payment.price.greaterThanOrEqualTo(0);
        if (!isPositive) {
            error(`payment is invalid because the price or value is negative. payment: %o`, this.payment);
        }
        return isPositive;
    }
    async canClaim() {
        let p = this.payment;
        const canClaim = await this.channelContract.canClaim(p.channelId, p.value, p.receiver, p.signature);
        if (!canClaim) {
            error(`Channel contract cannot accept the claim. Payment: %o`, p);
        }
        return canClaim;
    }
    async isAboveMinSettlementPeriod() {
        const settlementPeriod = await this.channelContract.getSettlementPeriod(this.payment.channelId);
        const minSettlementPeriod = new BigNumber.BigNumber(this.options.minimumSettlementPeriod || channel_manager_1.DEFAULT_SETTLEMENT_PERIOD);
        const isAboveMinSettlementPeriod = minSettlementPeriod.lessThanOrEqualTo(settlementPeriod);
        if (!isAboveMinSettlementPeriod) {
            error(`Settlement period is too short. settlement period: ${settlementPeriod}, minimum: ${minSettlementPeriod}. payment: %o`, this.payment);
        }
        return isAboveMinSettlementPeriod;
    }
}
exports.default = PaymentValidation;
//# sourceMappingURL=PaymentValidation.js.map