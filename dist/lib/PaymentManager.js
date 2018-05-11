"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payment_1 = require("./payment");
const PaymentValidation_1 = require("./PaymentValidation");
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
        let validation = new PaymentValidation_1.default(this.channelContract, payment, paymentChannel, this.options);
        return validation.isValid();
    }
}
exports.default = PaymentManager;
//# sourceMappingURL=PaymentManager.js.map