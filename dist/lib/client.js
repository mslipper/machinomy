"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const transport_1 = require("./transport");
const payment_1 = require("./payment");
const log_1 = require("./util/log");
const fetch_1 = require("./util/fetch");
const LOG = log_1.default('Client');
class AcceptPaymentRequest {
    constructor(payment) {
        this.payment = payment;
    }
}
exports.AcceptPaymentRequest = AcceptPaymentRequest;
class AcceptPaymentRequestSerde {
    serialize(obj) {
        return {
            payment: payment_1.PaymentSerde.instance.serialize(obj.payment)
        };
    }
    deserialize(data) {
        if (!data.payment) {
            throw new Error('Cannot deserialize payment request. Payment is missing.');
        }
        const payment = payment_1.PaymentSerde.instance.deserialize(data.payment);
        return new AcceptPaymentRequest(payment);
    }
}
AcceptPaymentRequestSerde.instance = new AcceptPaymentRequestSerde();
exports.AcceptPaymentRequestSerde = AcceptPaymentRequestSerde;
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
class AcceptTokenRequest {
    constructor(token) {
        this.token = token;
    }
}
exports.AcceptTokenRequest = AcceptTokenRequest;
class AcceptTokenRequestSerde {
    serialize(obj) {
        return {
            token: obj.token
        };
    }
    deserialize(data) {
        if (!data.token) {
            throw new Error('Cannot deserialize token request. Token is missing.');
        }
        return new AcceptTokenRequest(data.token);
    }
}
AcceptTokenRequestSerde.instance = new AcceptTokenRequestSerde();
exports.AcceptTokenRequestSerde = AcceptTokenRequestSerde;
class AcceptTokenResponse {
    constructor(status) {
        this.status = status;
    }
}
exports.AcceptTokenResponse = AcceptTokenResponse;
class AcceptTokenResponseSerde {
    serialize(obj) {
        return {
            status: obj.status
        };
    }
    deserialize(data) {
        if (data.status === undefined) {
            throw new Error('Cannot deserialize token response. Status is missing.');
        }
        return new AcceptTokenResponse(data.status);
    }
}
AcceptTokenResponseSerde.instance = new AcceptTokenResponseSerde();
exports.AcceptTokenResponseSerde = AcceptTokenResponseSerde;
class ClientImpl extends events_1.EventEmitter {
    constructor(transport, channelManager) {
        super();
        this.transport = transport;
        this.channelManager = channelManager;
    }
    doPreflight(uri) {
        this.emit('willPreflight');
        return this.transport.get(uri).then((res) => {
            this.emit('didPreflight');
            switch (res.statusCode) {
                case transport_1.STATUS_CODES.PAYMENT_REQUIRED:
                case transport_1.STATUS_CODES.OK:
                    return this.handlePaymentRequired(res);
                default:
                    throw new Error('Received bad response from content server.');
            }
        });
    }
    async doPayment(payment, gateway) {
        this.emit('willSendPayment');
        LOG(`Attempting to send payment to ${gateway}. Sender: ${payment.sender} / Receiver: ${payment.receiver} / Amount: ${payment.price.toString()}`);
        const request = new AcceptPaymentRequest(payment);
        const res = await fetch_1.default.fetch(gateway, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(AcceptPaymentRequestSerde.instance.serialize(request))
        });
        const resJson = await res.json();
        const deres = AcceptPaymentResponseSerde.instance.deserialize(resJson);
        LOG(`Successfully sent payment to ${gateway}.`);
        this.emit('didSendPayment');
        return deres;
    }
    acceptPayment(req) {
        const payment = req.payment;
        LOG(`Received payment request. Sender: ${payment.sender} / Receiver: ${payment.receiver}`);
        return this.channelManager.acceptPayment(payment)
            .then((token) => {
            LOG(`Accepted payment request. Sender: ${payment.sender} / Receiver: ${payment.receiver}`);
            return new AcceptPaymentResponse(token);
        });
    }
    async doVerify(token, gateway) {
        this.emit('willVerifyToken');
        LOG(`Attempting to verify token with ${gateway}.`);
        const request = new AcceptTokenRequest(token);
        try {
            const res = await fetch_1.default.fetch(gateway, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(AcceptTokenRequestSerde.instance.serialize(request))
            });
            const resJson = await res.json();
            const deres = AcceptTokenResponseSerde.instance.deserialize(resJson);
            LOG(`Successfully verified token with ${gateway}.`);
            this.emit('didVerifyToken');
            return deres;
        }
        catch (e) {
            return new AcceptTokenResponse(false);
        }
    }
    acceptVerify(req) {
        return this.channelManager.verifyToken(req.token)
            .then((res) => new AcceptTokenResponse(res))
            .catch(() => new AcceptTokenResponse(false));
    }
    handlePaymentRequired(res) {
        const headers = res.headers;
        ClientImpl.REQUIRED_HEADERS.forEach((name) => {
            const header = `${ClientImpl.HEADER_PREFIX}-${name}`;
            if (!headers[header]) {
                throw new Error(`Missing required header: ${header}`);
            }
        });
        return transport_1.PaymentRequired.parse(headers);
    }
}
ClientImpl.HEADER_PREFIX = 'paywall';
ClientImpl.REQUIRED_HEADERS = [
    'version',
    'address',
    'price',
    'gateway'
];
exports.ClientImpl = ClientImpl;
//# sourceMappingURL=client.js.map