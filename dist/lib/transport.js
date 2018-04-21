"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BigNumber = require("bignumber.js");
const log_1 = require("./util/log");
let req = require('request');
const request = (opts) => {
    return new Promise((resolve, reject) => {
        req(opts, (err, res) => {
            if (err) {
                reject(err);
            }
            resolve(res);
        });
    });
};
const LOG = log_1.default('Transport');
// noinspection MagicNumberJS
exports.STATUS_CODES = {
    PAYMENT_REQUIRED: 402,
    OK: 200
};
/**
 * Parse response headers and return the token.
 *
 * @param {object} response
 * @return {string}
 */
const extractPaywallToken = (response) => {
    let token = response.headers['paywall-token'];
    if (token) {
        LOG('Got token from the server');
        return token;
    }
    else {
        throw new Error('Can not find a token in the response');
    }
};
class Transport {
    /**
     * Request URI sending a paywall token.
     * @return {Promise<object>}
     */
    getWithToken(uri, token, opts = {}) {
        let headers = {
            'authorization': 'Paywall ' + token
        };
        LOG(`Getting ${uri} using access token ${token}`);
        if (opts.onWillLoad) {
            opts.onWillLoad();
        }
        return this.get(uri, headers).then(result => {
            if (opts.onDidLoad) {
                opts.onDidLoad();
            }
            return result;
        });
    }
    get(uri, headers) {
        let options = {
            method: 'GET',
            uri: uri,
            headers: headers
        };
        LOG(`Getting ${uri} using headers and options`, headers, options);
        return request(options);
    }
    /**
     * Request token from the server's gateway
     * @param {string} uri - Full url to the gateway.
     * @param {Payment} payment
     * @param {{uri: string, headers: object, onWillPreflight: function, onDidPreflight: function, onWillOpenChannel: function, onDidOpenChannel: function, onWillSendPayment: function, onDidSendPayment: function, onWillLoad: function, onDidLoad: function}} opts
     * @return {Promise<string>}
     */
    requestToken(uri, payment, opts = {}) {
        if (!payment.contractAddress) {
            delete payment.contractAddress;
        }
        let options = {
            method: 'POST',
            uri: uri,
            json: true,
            body: payment
        };
        LOG('Getting request token in exchange for payment', payment);
        if (opts.onWillSendPayment) {
            opts.onWillSendPayment();
        }
        return request(options).then(extractPaywallToken).then(result => {
            if (opts.onDidSendPayment) {
                opts.onDidSendPayment();
            }
            return result;
        });
    }
}
exports.Transport = Transport;
class PaymentRequired {
    constructor(receiver, price, gateway, meta, contractAddress) {
        this.receiver = receiver;
        this.price = price;
        this.gateway = gateway;
        this.meta = meta;
        this.contractAddress = contractAddress;
    }
}
PaymentRequired.parse = function (headers) {
    let receiver = headers['paywall-address'];
    let price = new BigNumber.BigNumber(headers['paywall-price']);
    let gateway = headers['paywall-gateway'];
    let contractAddress = headers['paywall-token-address'];
    let meta = headers['paywall-meta'];
    return new PaymentRequired(receiver, price, gateway, meta, contractAddress);
};
exports.PaymentRequired = PaymentRequired;
/**
 * Build Transport instance.
 */
exports.build = () => {
    return new Transport();
};
//# sourceMappingURL=transport.js.map