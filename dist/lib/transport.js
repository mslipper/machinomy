"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BigNumber = require("bignumber.js");
var log_1 = require("./util/log");
var req = require('request');
var request = function (opts) {
    return new Promise(function (resolve, reject) {
        req(opts, function (err, res) {
            if (err) {
                reject(err);
            }
            resolve(res);
        });
    });
};
var LOG = log_1.default('Transport');
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
var extractPaywallToken = function (response) {
    var token = response.headers['paywall-token'];
    if (token) {
        LOG('Got token from the server');
        return token;
    }
    else {
        throw new Error('Can not find a token in the response');
    }
};
var Transport = /** @class */ (function () {
    function Transport() {
    }
    /**
     * Request URI sending a paywall token.
     * @return {Promise<object>}
     */
    Transport.prototype.getWithToken = function (uri, token, opts) {
        if (opts === void 0) { opts = {}; }
        var headers = {
            'authorization': 'Paywall ' + token
        };
        LOG("Getting " + uri + " using access token " + token);
        if (opts.onWillLoad) {
            opts.onWillLoad();
        }
        return this.get(uri, headers).then(function (result) {
            if (opts.onDidLoad) {
                opts.onDidLoad();
            }
            return result;
        });
    };
    Transport.prototype.get = function (uri, headers) {
        var options = {
            method: 'GET',
            uri: uri,
            headers: headers
        };
        LOG("Getting " + uri + " using headers and options", headers, options);
        return request(options);
    };
    /**
     * Request token from the server's gateway
     * @param {string} uri - Full url to the gateway.
     * @param {Payment} payment
     * @param {{uri: string, headers: object, onWillPreflight: function, onDidPreflight: function, onWillOpenChannel: function, onDidOpenChannel: function, onWillSendPayment: function, onDidSendPayment: function, onWillLoad: function, onDidLoad: function}} opts
     * @return {Promise<string>}
     */
    Transport.prototype.requestToken = function (uri, payment, opts) {
        if (opts === void 0) { opts = {}; }
        if (!payment.contractAddress) {
            delete payment.contractAddress;
        }
        var options = {
            method: 'POST',
            uri: uri,
            json: true,
            body: payment
        };
        LOG('Getting request token in exchange for payment', payment);
        if (opts.onWillSendPayment) {
            opts.onWillSendPayment();
        }
        return request(options).then(extractPaywallToken).then(function (result) {
            if (opts.onDidSendPayment) {
                opts.onDidSendPayment();
            }
            return result;
        });
    };
    return Transport;
}());
exports.Transport = Transport;
var PaymentRequired = /** @class */ (function () {
    function PaymentRequired(receiver, price, gateway, meta, contractAddress) {
        this.receiver = receiver;
        this.price = price;
        this.gateway = gateway;
        this.meta = meta;
        this.contractAddress = contractAddress;
    }
    PaymentRequired.parse = function (headers) {
        var receiver = headers['paywall-address'];
        var price = new BigNumber.BigNumber(headers['paywall-price']);
        var gateway = headers['paywall-gateway'];
        var contractAddress = headers['paywall-token-address'];
        var meta = headers['paywall-meta'];
        return new PaymentRequired(receiver, price, gateway, meta, contractAddress);
    };
    return PaymentRequired;
}());
exports.PaymentRequired = PaymentRequired;
/**
 * Build Transport instance.
 */
exports.build = function () {
    return new Transport();
};
//# sourceMappingURL=transport.js.map