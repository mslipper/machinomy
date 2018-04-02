"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var channel = require("../lib/channel");
var support = require("./support");
var payment_1 = require("../lib/payment");
var signature_1 = require("../lib/signature");
var expect = require('expect');
var HEX_ADDRESS = 'eb61859a9d74f95bda8a6f9d3efcfe6478e49151';
describe('channel', function () {
    describe('.id', function () {
        var buffer = Buffer.from(HEX_ADDRESS, 'hex');
        var expected = new channel.ChannelId(buffer);
        it('build ChannelId from non-prefixed hex', function () {
            var channelId = channel.id(HEX_ADDRESS);
            expect(channelId).toEqual(expected);
        });
        it('build ChannelId from prefixed hex', function () {
            var channelId = channel.id('0x' + HEX_ADDRESS);
            expect(channelId).toEqual(expected);
        });
        it('build ChannelId from Buffer', function () {
            var channelId = channel.id(buffer);
            expect(channelId).toEqual(expected);
        });
        it('build ChannelId from ChannelId', function () {
            var channelId = channel.id(expected);
            expect(channelId).toEqual(expected);
        });
    });
    describe('ChannelId', function () {
        describe('#toString', function () {
            it('return prefixed hex', function () {
                var channelId = channel.id(HEX_ADDRESS);
                var actual = channelId.toString();
                expect(actual).toEqual('0x' + HEX_ADDRESS);
            });
        });
    });
    describe('Payment', function () {
        describe('.fromPaymentChannel', function () {
            it('build Payment object', function () {
                var channelId = channel.id(Buffer.from(support.randomInteger().toString()));
                var payment = new payment_1.default({
                    channelId: channelId.toString(),
                    sender: 'sender',
                    receiver: 'receiver',
                    price: support.randomBigNumber(),
                    value: support.randomBigNumber(),
                    channelValue: support.randomBigNumber(),
                    meta: 'metaexample',
                    signature: signature_1.default.fromParts({
                        v: 27,
                        r: '0x2',
                        s: '0x3'
                    }),
                    token: undefined,
                    contractAddress: undefined
                });
                var paymentChannel = channel.PaymentChannel.fromPayment(payment);
                expect(paymentChannel.channelId).toBe(payment.channelId);
                expect(paymentChannel.sender).toBe(payment.sender);
                expect(paymentChannel.receiver).toBe(payment.receiver);
                expect(paymentChannel.value).toEqual(payment.channelValue);
            });
        });
    });
});
//# sourceMappingURL=channel.test.js.map