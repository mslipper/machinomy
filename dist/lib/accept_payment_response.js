"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AcceptPaymentResponse {
    constructor(token) {
        this.token = token;
    }
}
exports.AcceptPaymentResponse = AcceptPaymentResponse;
class AcceptPaymentResponseSerde {
    serialize(obj) {
        return {
            token: obj.token
        };
    }
    deserialize(data) {
        if (!data.token) {
            throw new Error('Cannot deserialize payment response. Token is missing.');
        }
        return new AcceptPaymentResponse(data.token);
    }
}
AcceptPaymentResponseSerde.instance = new AcceptPaymentResponseSerde();
exports.AcceptPaymentResponseSerde = AcceptPaymentResponseSerde;
//# sourceMappingURL=accept_payment_response.js.map