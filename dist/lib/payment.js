"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BigNumber = require("bignumber.js");
const signature_1 = require("./signature");
class Payment {
    constructor(options) {
        this.channelId = options.channelId;
        this.sender = options.sender;
        this.receiver = options.receiver;
        this.price = options.price;
        this.value = options.value;
        this.channelValue = options.channelValue;
        this.signature = options.signature;
        this.meta = options.meta;
        this.contractAddress = options.contractAddress;
        this.token = options.token;
        this.createdAt = options.createdAt;
    }
}
exports.default = Payment;
class PaymentSerde {
    serialize(obj) {
        const sig = obj.signature.toParts();
        return {
            channelId: obj.channelId.toString(),
            value: obj.value.toString(),
            sender: obj.sender,
            receiver: obj.receiver,
            price: obj.price.toString(),
            channelValue: obj.channelValue.toString(),
            v: sig.v,
            r: sig.r,
            s: sig.s,
            contractAddress: obj.contractAddress,
            token: obj.token,
            meta: obj.meta,
            createdAt: obj.createdAt
        };
    }
    deserialize(data) {
        PaymentSerde.required.forEach((field) => {
            if (!data[field]) {
                throw new Error(`Required field not found: ${field}`);
            }
        });
        return new Payment({
            channelId: data.channelId,
            value: new BigNumber.BigNumber(data.value),
            sender: data.sender,
            receiver: data.receiver,
            price: new BigNumber.BigNumber(data.price),
            channelValue: new BigNumber.BigNumber(data.channelValue),
            signature: signature_1.default.fromParts({
                v: Number(data.v),
                r: data.r,
                s: data.s
            }),
            contractAddress: data.contractAddress,
            token: data.token,
            meta: data.meta,
            createdAt: Number(data.createdAt)
        });
    }
}
PaymentSerde.instance = new PaymentSerde();
PaymentSerde.required = [
    'channelId',
    'value',
    'sender',
    'receiver',
    'price',
    'channelValue',
    'v',
    'r',
    's'
];
exports.PaymentSerde = PaymentSerde;
//# sourceMappingURL=payment.js.map