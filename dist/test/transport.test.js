"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nock = require("nock");
var channel = require("../lib/channel");
var transport = require("../lib/transport");
var support_1 = require("./support");
var payment_1 = require("../lib/payment");
var BigNumber = require("bignumber.js");
var signature_1 = require("../lib/signature");
var expect = require('expect');
describe('transport', function () {
    describe('.build', function () {
        it('return Transport instance', function () {
            var t = transport.build();
            expect(typeof t).toBe('object');
        });
    });
    describe('Transport', function () {
        var t = transport.build();
        var expectedResponse = 'YABADABA';
        describe('#get', function () {
            it('make GET request', function () {
                nock('http://example.com').get('/path').reply(200, expectedResponse);
                return t.get('http://example.com/path').then(function (response) {
                    expect(response.body).toBe(expectedResponse);
                });
            });
            it('send headers', function () {
                nock('http://example.com', { reqheaders: { 'X-Header': expectedResponse } })
                    .get('/path')
                    .reply(200, expectedResponse);
                return t.get('http://example.com/path', { 'X-Header': expectedResponse }).then(function (response) {
                    expect(response.body).toBe(expectedResponse);
                });
            });
        });
        describe('#getWithToken', function () {
            it('make GET request with headers', function () {
                var expectedToken = 'tkn';
                nock('http://example.com', { reqheaders: { 'authorization': "Paywall " + expectedToken } })
                    .get('/path')
                    .reply(200, expectedResponse);
                return t.getWithToken('http://example.com/path', expectedToken).then(function (response) {
                    expect(response.body).toBe(expectedResponse);
                });
            });
        });
        describe('#requestToken', function () {
            var channelId = channel.id(Buffer.from(support_1.randomInteger().toString()));
            var payment = new payment_1.default({
                channelId: channelId.toString(),
                sender: 'sender',
                receiver: 'receiver',
                price: new BigNumber.BigNumber(10),
                value: new BigNumber.BigNumber(12),
                channelValue: new BigNumber.BigNumber(10),
                meta: 'metaexample',
                signature: signature_1.default.fromParts({
                    v: 27,
                    r: '0x2',
                    s: '0x3'
                }),
                token: undefined,
                contractAddress: undefined
            });
            var randomToken = support_1.randomInteger().toString();
            nock('http://example.com').post('/path').reply(202, '', {
                'paywall-token': randomToken
            });
            it('send payment, get token', function () {
                return t.requestToken('http://example.com/path', payment).then(function (token) {
                    expect(token).toBe(randomToken);
                });
            });
        });
    });
    describe('PaymentRequired', function () {
        describe('.parse', function () {
            var headers = {
                'paywall-address': '0xdeadbeaf',
                'paywall-price': '10',
                'paywall-gateway': 'http://example.com/gateway'
            };
            var paymentRequired = transport.PaymentRequired.parse(headers);
            expect(paymentRequired.receiver).toBe(headers['paywall-address']);
            expect(paymentRequired.price.toString()).toBe(headers['paywall-price']);
            expect(paymentRequired.gateway).toBe(headers['paywall-gateway']);
        });
    });
});
//# sourceMappingURL=transport.test.js.map