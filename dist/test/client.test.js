"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var sinon = require("sinon");
var BigNumber = require("bignumber.js");
var client_1 = require("../lib/client");
var expects_rejection_1 = require("./util/expects_rejection");
var payment_1 = require("../lib/payment");
var fetch_1 = require("../lib/util/fetch");
var expect = require('expect');
describe('ClientImpl', function () {
    var transport;
    var channelManager;
    var client;
    beforeEach(function () {
        transport = {};
        channelManager = {};
        client = new client_1.ClientImpl(transport, channelManager);
    });
    describe('doPreflight', function () {
        it('returns payment required when a payment required or OK response comes back', function () {
            return Promise.all([200, 402].map(function (statusCode) {
                transport.get = sinon.stub().withArgs('http://honkhost:1234/site').resolves({
                    statusCode: 402,
                    headers: {
                        'paywall-version': '1.0',
                        'paywall-address': '0x1234',
                        'paywall-price': '1000',
                        'paywall-gateway': 'http://honkhost:8080/machinomy',
                        'paywall-meta': 'hello',
                        'paywall-token-address': '0xbeef'
                    }
                });
                return client.doPreflight('http://honkhost:1234/site').then(function (res) {
                    expect(res.receiver).toBe('0x1234');
                    expect(res.price).toEqual(new BigNumber.BigNumber(1000));
                    expect(res.gateway).toBe('http://honkhost:8080/machinomy');
                    expect(res.meta).toBe('hello');
                    expect(res.contractAddress).toBe('0xbeef');
                });
            }));
        });
        it('throws an error for any other status code', function () {
            transport.get = sinon.stub().withArgs('http://honkhost:1234/site').resolves({
                statusCode: 300
            });
            return expects_rejection_1.default(client.doPreflight('http://honkhost:1234/site'));
        });
        it('throws an error when required headers don\'t show up', function () {
            var prefixes = [
                'version',
                'address',
                'price',
                'gateway'
            ];
            var headers = {
                'paywall-version': '1.0',
                'paywall-address': '0x1234',
                'paywall-price': '1000',
                'paywall-gateway': 'http://honkhost:8080/machinomy',
                'paywall-meta': 'hello',
                'paywall-token-address': '0xbeef'
            };
            return Promise.all(prefixes.map(function (prefix) {
                var badHeaders = __assign({}, headers);
                delete badHeaders["paywall-" + prefix];
                transport.get = sinon.stub().withArgs('http://honkhost:1234/site').resolves({
                    statusCode: 402,
                    headers: badHeaders
                });
                return expects_rejection_1.default(client.doPreflight('http://honkhost:1234/site'));
            }));
        });
    });
    describe('doPayment', function () {
        var paymentJson;
        var post;
        beforeEach(function () {
            paymentJson = {
                channelId: '0x1234',
                value: '1000',
                sender: '0xbeef',
                receiver: '0xdead',
                price: '100',
                channelValue: '1000',
                v: 27,
                r: '0x000000000000000000000000000000000000000000000000000000000000000a',
                s: '0x000000000000000000000000000000000000000000000000000000000000000a',
                contractAddress: '0xab',
                token: '0x123'
            };
            post = sinon.stub(fetch_1.default, 'fetch');
            post.withArgs('gateway', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: sinon.match.string
            }).resolves({
                json: function () { return Promise.resolve({ token: 'beep' }); }
            });
        });
        afterEach(function () {
            post.restore();
        });
        it('returns an AcceptPaymentResponse on success', function () {
            var payment = payment_1.PaymentSerde.instance.deserialize(paymentJson);
            return client.doPayment(payment, 'gateway').then(function (res) {
                expect(res.token).toBe('beep');
            });
        });
        it('emits willSendPayment and didSendPayment', function () {
            var payment = payment_1.PaymentSerde.instance.deserialize(paymentJson);
            var will = sinon.stub();
            var did = sinon.stub();
            client.addListener('willSendPayment', will);
            client.addListener('didSendPayment', did);
            return client.doPayment(payment, 'gateway').then(function (res) {
                expect(will.called).toBe(true);
                expect(did.called).toBe(true);
            });
        });
        it('throws an error if deserialization fails', function () {
            var payment = payment_1.PaymentSerde.instance.deserialize(paymentJson);
            post.withArgs('gateway', {
                json: true,
                body: {
                    payment: paymentJson
                }
            }).resolves({
                falafels: 'are good'
            });
            return expects_rejection_1.default(client.doPayment(payment, 'gateway'));
        });
    });
    describe('acceptPayment', function () {
        it('returns an AcceptPaymentResponse from the channel manager', function () {
            var req = client_1.AcceptPaymentRequestSerde.instance.deserialize({
                payment: {
                    channelId: '0x1234',
                    value: '1000',
                    sender: '0xbeef',
                    receiver: '0xdead',
                    price: '100',
                    channelValue: '1000',
                    v: 27,
                    r: '0xa',
                    s: '0xb',
                    contractAddress: '0xab',
                    token: '0x123'
                }
            });
            channelManager.acceptPayment = sinon.stub().withArgs(req.payment).resolves('token');
            return client.acceptPayment(req).then(function (res) {
                expect(res.token).toBe('token');
            });
        });
    });
    describe('doVerify', function () {
        var post;
        beforeEach(function () {
            post = sinon.stub(fetch_1.default, 'fetch');
            post.withArgs('gateway', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ token: 'token' })
            });
        });
        afterEach(function () {
            post.restore();
        });
        it('returns an AcceptTokenResponse if the token is accepted', function () {
            post.resolves({
                json: function () { return Promise.resolve({ status: true }); }
            });
            return client.doVerify('token', 'gateway').then(function (res) {
                expect(res.status).toBe(true);
            });
        });
        it('returns an AcceptTokenResponse if the token is rejected', function () {
            post.resolves({
                status: false
            });
            return client.doVerify('token', 'gateway').then(function (res) {
                expect(res.status).toBe(false);
            });
        });
        it('returns a false AcceptTokenResponse if an error occurs', function () {
            post.rejects();
            return client.doVerify('token', 'gateway').then(function (res) {
                expect(res.status).toBe(false);
            });
        });
    });
    describe('acceptVerify', function () {
        it('returns an AcceptTokenResponse based on the request', function () {
            channelManager.verifyToken = sinon.stub().withArgs('token').resolves(true);
            return client.acceptVerify({ token: 'token' }).then(function (res) {
                expect(res.status).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=client.test.js.map