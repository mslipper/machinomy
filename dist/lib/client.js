"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const transport_1 = require("./transport");
const log_1 = require("./util/log");
const fetch_1 = require("./util/fetch");
const accept_payment_request_1 = require("./accept_payment_request");
const accept_payment_response_1 = require("./accept_payment_response");
const accept_token_request_1 = require("./accept_token_request");
const accept_token_response_1 = require("./accept_token_response");
const LOG = log_1.default('Client');
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
    async doPayment(payment, gateway, purchaseMeta) {
        this.emit('willSendPayment');
        LOG(`Attempting to send payment to ${gateway}. Sender: ${payment.sender} / Receiver: ${payment.receiver} / Amount: ${payment.price.toString()}`);
        const request = new accept_payment_request_1.AcceptPaymentRequest(payment, purchaseMeta);
        const res = await fetch_1.default.fetch(gateway, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(accept_payment_request_1.AcceptPaymentRequestSerde.instance.serialize(request))
        });
        const resJson = await res.json();
        const deres = accept_payment_response_1.AcceptPaymentResponseSerde.instance.deserialize(resJson);
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
            return new accept_payment_response_1.AcceptPaymentResponse(token);
        });
    }
    async doVerify(token, gateway) {
        this.emit('willVerifyToken');
        LOG(`Attempting to verify token with ${gateway}.`);
        const request = new accept_token_request_1.AcceptTokenRequest(token);
        try {
            const res = await fetch_1.default.fetch(gateway, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(accept_token_request_1.AcceptTokenRequestSerde.instance.serialize(request))
            });
            const resJson = await res.json();
            const deres = accept_token_response_1.AcceptTokenResponseSerde.instance.deserialize(resJson);
            LOG(`Successfully verified token with ${gateway}.`);
            this.emit('didVerifyToken');
            return deres;
        }
        catch (e) {
            return new accept_token_response_1.AcceptTokenResponse(false);
        }
    }
    acceptVerify(req) {
        return this.channelManager.verifyToken(req.token)
            .then((res) => new accept_token_response_1.AcceptTokenResponse(res))
            .catch(() => new accept_token_response_1.AcceptTokenResponse(false));
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