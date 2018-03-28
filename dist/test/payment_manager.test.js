"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sinon = require("sinon");
var BigNumber = require("bignumber.js");
var payment_manager_1 = require("../lib/payment_manager");
var signature_1 = require("../lib/signature");
var payment_channel_1 = require("../lib/payment_channel");
var expect = require('expect');
describe('PaymentManager', function () {
    var chainManager;
    var channelContract;
    var options;
    var manager;
    beforeEach(function () {
        chainManager = {};
        channelContract = {};
        options = {};
        manager = new payment_manager_1.default(chainManager, channelContract, options);
    });
    describe('#buildPaymentForChannel', function () {
        it('builds a signed payment', function () {
            var chan = new payment_channel_1.PaymentChannel('send', 'recv', 'id', new BigNumber.BigNumber(100), new BigNumber.BigNumber(10), 0, '0xcabdab');
            channelContract.paymentDigest = sinon.stub().withArgs('id', new BigNumber.BigNumber(15)).resolves('digest');
            chainManager.sign = sinon.stub().withArgs('sender', 'digest').resolves(signature_1.default.fromParts({
                v: 27,
                r: '0x01',
                s: '0x02'
            }));
            var expSig = signature_1.default.fromParts({
                v: 27,
                r: '0x01',
                s: '0x02'
            });
            return manager.buildPaymentForChannel(chan, new BigNumber.BigNumber(5), new BigNumber.BigNumber(6), 'meta').then(function (pmt) {
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
//# sourceMappingURL=payment_manager.test.js.map