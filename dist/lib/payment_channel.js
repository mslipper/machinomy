"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BigNumber = require("bignumber.js");
/**
 * The Payment Channel
 */
class PaymentChannel {
    /**
     * @param sender      Ethereum address of the client.
     * @param receiver    Ethereum address of the server.
     * @param channelId   Identifier of the channel.
     * @param value       Total value of the channel.
     * @param spent       Value sent by {sender} to {receiver}.
     * @param state       0 - 'open', 1 - 'settling', 2 - 'settled'
     */
    constructor(sender, receiver, channelId, value, spent, state = 0, contractAddress) {
        this.sender = sender;
        this.receiver = receiver;
        this.channelId = channelId;
        this.value = new BigNumber.BigNumber(value.toString());
        this.spent = new BigNumber.BigNumber(spent.toString());
        this.state = state || 0;
        this.contractAddress = contractAddress;
    }
    static fromPayment(payment) {
        return new PaymentChannel(payment.sender, payment.receiver, payment.channelId, payment.channelValue, payment.value, undefined, payment.contractAddress);
    }
    static fromDocument(document) {
        return new PaymentChannel(document.sender, document.receiver, document.channelId, document.value, document.spent, document.state, document.contractAddress);
    }
}
exports.PaymentChannel = PaymentChannel;
class PaymentChannelSerde {
    serialize(obj) {
        return {
            state: obj.state,
            spent: obj.spent.toString(),
            value: obj.value.toString(),
            channelId: obj.channelId.toString(),
            receiver: obj.receiver,
            sender: obj.sender,
            contractAddress: obj.contractAddress
        };
    }
    deserialize(data) {
        return new PaymentChannel(data.sender, data.receiver, data.channelId, data.value, data.spent, data.state, data.contractAddress);
    }
}
PaymentChannelSerde.instance = new PaymentChannelSerde();
exports.PaymentChannelSerde = PaymentChannelSerde;
//# sourceMappingURL=payment_channel.js.map