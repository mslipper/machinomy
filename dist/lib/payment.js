"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BigNumber = require("bignumber.js");
var signature_1 = require("./signature");
var Payment = /** @class */ (function () {
    function Payment(options) {
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
    return Payment;
}());
exports.default = Payment;
var PaymentSerde = /** @class */ (function () {
    function PaymentSerde() {
    }
    PaymentSerde.prototype.serialize = function (obj) {
        var sig = obj.signature.toParts();
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
    };
    PaymentSerde.prototype.deserialize = function (data) {
        PaymentSerde.required.forEach(function (field) {
            if (!data[field]) {
                throw new Error("Required field not found: " + field);
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
    };
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
    return PaymentSerde;
}());
exports.PaymentSerde = PaymentSerde;
//# sourceMappingURL=payment.js.map