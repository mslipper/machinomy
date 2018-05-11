"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payment_1 = require("./payment");
class AcceptPaymentRequest {
    constructor(payment, purchaseMeta) {
        this.payment = payment;
        this.purchaseMeta = purchaseMeta;
    }
}
exports.AcceptPaymentRequest = AcceptPaymentRequest;
class AcceptPaymentRequestSerde {
    serialize(obj) {
        return {
            payment: payment_1.PaymentSerde.instance.serialize(obj.payment),
            purchaseMeta: obj.purchaseMeta
        };
    }
    deserialize(data) {
        if (!data.payment) {
            throw new Error('Cannot deserialize payment request. Payment is missing.');
        }
        if (data.purchaseMeta && !data.purchaseMeta.type) {
            throw new Error('Purchase meta requires a type field.');
        }
        return {
            payment: payment_1.PaymentSerde.instance.deserialize(data.payment),
            purchaseMeta: data.purchaseMeta
        };
    }
}
AcceptPaymentRequestSerde.instance = new AcceptPaymentRequestSerde();
exports.AcceptPaymentRequestSerde = AcceptPaymentRequestSerde;
//# sourceMappingURL=accept_payment_request.js.map