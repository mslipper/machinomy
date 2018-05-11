"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const BigNumber = require("bignumber.js");
const PaymentManager_1 = require("../lib/PaymentManager");
const signature_1 = require("../lib/signature");
const payment_channel_1 = require("../lib/payment_channel");
const expect = require('expect');
describe('PaymentManager', () => {
    let chainManager;
    let channelContract;
    let options;
    let manager;
    beforeEach(() => {
        chainManager = {};
        channelContract = {};
        options = {};
        manager = new PaymentManager_1.default(chainManager, channelContract, options);
    });
    describe('#buildPaymentForChannel', () => {
        it('builds a signed payment', () => {
            const chan = new payment_channel_1.PaymentChannel('send', 'recv', 'id', new BigNumber.BigNumber(100), new BigNumber.BigNumber(10), 0, '0xcabdab');
            channelContract.paymentDigest = sinon.stub().withArgs('id', new BigNumber.BigNumber(15)).resolves('digest');
            chainManager.sign = sinon.stub().withArgs('sender', 'digest').resolves(signature_1.default.fromParts({
                v: 27,
                r: '0x01',
                s: '0x02'
            }));
            const expSig = signature_1.default.fromParts({
                v: 27,
                r: '0x01',
                s: '0x02'
            });
            return manager.buildPaymentForChannel(chan, new BigNumber.BigNumber(5), new BigNumber.BigNumber(6), 'meta').then((pmt) => {
                expect(pmt.channelId).toBe('id');
                expect(pmt.sender).toBe('send');
                expect(pmt.receiver).toBe('recv');
                expect(pmt.price).toEqual(new BigNumber.BigNumber(5));
                expect(pmt.value).toEqual(new BigNumber.BigNumber(6));
                expect(pmt.channelValue).toEqual(new BigNumber.BigNumber(100));
                expect(pmt.signature.isEqual(expSig)).toBe(true);
                expect(pmt.meta).toBe('meta');
                expect(pmt.contractAddress).toBe('0xcabdab');
                expect(pmt.token).toBe(undefined);
            });
        });
    });
});
//# sourceMappingURL=PaymentManager.test.js.map