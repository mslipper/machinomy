"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const BigNumber = require("bignumber.js");
const client_1 = require("../lib/client");
const expects_rejection_1 = require("./util/expects_rejection");
const payment_1 = require("../lib/payment");
const fetch_1 = require("../lib/util/fetch");
const expect = require('expect');
describe('ClientImpl', () => {
    let transport;
    let channelManager;
    let client;
    beforeEach(() => {
        transport = {};
        channelManager = {};
        client = new client_1.ClientImpl(transport, channelManager);
    });
    describe('doPreflight', () => {
        it('returns payment required when a payment required or OK response comes back', () => {
            return Promise.all([200, 402].map((statusCode) => {
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
                return client.doPreflight('http://honkhost:1234/site').then((res) => {
                    expect(res.receiver).toBe('0x1234');
                    expect(res.price).toEqual(new BigNumber.BigNumber(1000));
                    expect(res.gateway).toBe('http://honkhost:8080/machinomy');
                    expect(res.meta).toBe('hello');
                    expect(res.contractAddress).toBe('0xbeef');
                });
            }));
        });
        it('throws an error for any other status code', () => {
            transport.get = sinon.stub().withArgs('http://honkhost:1234/site').resolves({
                statusCode: 300
            });
            return expects_rejection_1.default(client.doPreflight('http://honkhost:1234/site'));
        });
        it('throws an error when required headers don\'t show up', () => {
            const prefixes = [
                'version',
                'address',
                'price',
                'gateway'
            ];
            const headers = {
                'paywall-version': '1.0',
                'paywall-address': '0x1234',
                'paywall-price': '1000',
                'paywall-gateway': 'http://honkhost:8080/machinomy',
                'paywall-meta': 'hello',
                'paywall-token-address': '0xbeef'
            };
            return Promise.all(prefixes.map((prefix) => {
                const badHeaders = Object.assign({}, headers);
                delete badHeaders[`paywall-${prefix}`];
                transport.get = sinon.stub().withArgs('http://honkhost:1234/site').resolves({
                    statusCode: 402,
                    headers: badHeaders
                });
                return expects_rejection_1.default(client.doPreflight('http://honkhost:1234/site'));
            }));
        });
    });
    describe('doPayment', () => {
        let paymentJson;
        let post;
        beforeEach(() => {
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
                json: () => Promise.resolve({ token: 'beep' })
            });
        });
        afterEach(() => {
            post.restore();
        });
        it('returns an AcceptPaymentResponse on success', () => {
            const payment = payment_1.PaymentSerde.instance.deserialize(paymentJson);
            return client.doPayment(payment, 'gateway').then((res) => {
                expect(res.token).toBe('beep');
            });
        });
        it('emits willSendPayment and didSendPayment', () => {
            const payment = payment_1.PaymentSerde.instance.deserialize(paymentJson);
            const will = sinon.stub();
            const did = sinon.stub();
            client.addListener('willSendPayment', will);
            client.addListener('didSendPayment', did);
            return client.doPayment(payment, 'gateway').then((res) => {
                expect(will.called).toBe(true);
                expect(did.called).toBe(true);
            });
        });
        it('throws an error if deserialization fails', () => {
            const payment = payment_1.PaymentSerde.instance.deserialize(paymentJson);
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
    describe('acceptPayment', () => {
        it('returns an AcceptPaymentResponse from the channel manager', () => {
            const req = client_1.AcceptPaymentRequestSerde.instance.deserialize({
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
            return client.acceptPayment(req).then((res) => {
                expect(res.token).toBe('token');
            });
        });
    });
    describe('doVerify', () => {
        let post;
        beforeEach(() => {
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
        afterEach(() => {
            post.restore();
        });
        it('returns an AcceptTokenResponse if the token is accepted', () => {
            post.resolves({
                json: () => Promise.resolve({ status: true })
            });
            return client.doVerify('token', 'gateway').then((res) => {
                expect(res.status).toBe(true);
            });
        });
        it('returns an AcceptTokenResponse if the token is rejected', () => {
            post.resolves({
                status: false
            });
            return client.doVerify('token', 'gateway').then((res) => {
                expect(res.status).toBe(false);
            });
        });
        it('returns a false AcceptTokenResponse if an error occurs', () => {
            post.rejects();
            return client.doVerify('token', 'gateway').then((res) => {
                expect(res.status).toBe(false);
            });
        });
    });
    describe('acceptVerify', () => {
        it('returns an AcceptTokenResponse based on the request', () => {
            channelManager.verifyToken = sinon.stub().withArgs('token').resolves(true);
            return client.acceptVerify({ token: 'token' }).then((res) => {
                expect(res.status).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=client.test.js.map