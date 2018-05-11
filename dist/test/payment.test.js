"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ChannelId_1 = require("../lib/ChannelId");
const support = require("./support");
const payment_1 = require("../lib/payment");
const signature_1 = require("../lib/signature");
const payment_channel_1 = require("../lib/payment_channel");
const expect = require("expect");
describe('Payment', () => {
    describe('.fromPaymentChannel', () => {
        it('build Payment object', () => {
            let channelId = ChannelId_1.default.random();
            let payment = new payment_1.default({
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
            let paymentChannel = payment_channel_1.PaymentChannel.fromPayment(payment);
            expect(paymentChannel.channelId).toBe(payment.channelId);
            expect(paymentChannel.sender).toBe(payment.sender);
            expect(paymentChannel.receiver).toBe(payment.receiver);
            expect(paymentChannel.value).toEqual(payment.channelValue);
        });
    });
});
//# sourceMappingURL=payment.test.js.map