"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var uuid = require("uuid");
var BigNumber = require("bignumber.js");
var sinon = require("sinon");
var contracts_1 = require("@machinomy/contracts");
var channel_contract_1 = require("../lib/channel_contract");
var signature_1 = require("../lib/signature");
var expect = require('expect');
describe('ChannelContract', function () {
    var ID = '0e29e61f256b40b2a6280f8181a1b5ff';
    var SIG = signature_1.default.fromRpcSig('0xd8a923b39ae82bb39d3b64d58f06e1d776bcbcae34e5b4a6f4a952e8892e6a5b4c0f88833c06fe91729057035161e599fda536e8ce0ab4be2c214d6ea961e93a01');
    var web3;
    var deployed;
    var contractStub;
    var uuidStub;
    var contract;
    beforeEach(function () {
        web3 = {
            currentProvider: {}
        };
        deployed = {};
        uuidStub = sinon.stub(uuid, 'v4').returns('0e29e61f-256b-40b2-a628-0f8181a1b5ff');
        contractStub = sinon.stub(contracts_1.Unidirectional, 'contract');
        contractStub.withArgs(web3.currentProvider).returns({
            deployed: sinon.stub().resolves(deployed)
        });
        contract = new channel_contract_1.default(web3);
    });
    afterEach(function () {
        contractStub.restore();
        uuidStub.restore();
    });
    describe('#open', function () {
        it('opens a channel with the correct id, sender, receiver, settlement period, price, and gas params', function () {
            deployed.open = sinon.stub();
            return contract.open('send', 'recv', new BigNumber.BigNumber(10), 1234).then(function () {
                expect(deployed.open.calledWith(ID, 'recv', 1234, {
                    from: 'send',
                    value: new BigNumber.BigNumber(10),
                    gas: 300000
                })).toBe(true);
            });
        });
    });
    describe('#claim', function () {
        it('claims the channel', function () {
            deployed.claim = sinon.stub();
            return contract.claim('recv', ID, new BigNumber.BigNumber(10), SIG).then(function () {
                expect(deployed.claim.calledWith(ID, new BigNumber.BigNumber(10), SIG.toString(), {
                    from: 'recv'
                })).toBe(true);
            });
        });
    });
    describe('#deposit', function () {
        it('deposits money into the channel', function () {
            deployed.deposit = sinon.stub();
            return contract.deposit('send', ID, new BigNumber.BigNumber(10)).then(function () {
                expect(deployed.deposit.calledWith(ID, {
                    from: 'send',
                    value: new BigNumber.BigNumber(10),
                    gas: 300000
                })).toBe(true);
            });
        });
    });
    describe('#getState', function () {
        it('returns 0 if the channel is open', function () {
            deployed.isOpen = sinon.stub().withArgs(ID).resolves(true);
            deployed.isSettling = sinon.stub().withArgs(ID).resolves(false);
            return contract.getState(ID).then(function (state) {
                expect(state).toBe(0);
            });
        });
        it('returns 1 if the channel is settling', function () {
            deployed.isOpen = sinon.stub().withArgs(ID).resolves(false);
            deployed.isSettling = sinon.stub().withArgs(ID).resolves(true);
            return contract.getState(ID).then(function (state) {
                expect(state).toBe(1);
            });
        });
    });
    describe('#startSettle', function () {
        it('starts settling the channel', function () {
            deployed.startSettling = sinon.stub();
            return contract.startSettle('acc', ID).then(function () {
                expect(deployed.startSettling.calledWith(ID, { from: 'acc' })).toBe(true);
            });
        });
    });
    describe('#finishSettle', function () {
        it('finishes settling the channel', function () {
            deployed.settle = sinon.stub();
            return contract.finishSettle('acc', ID).then(function () {
                expect(deployed.settle.calledWith(ID, { from: 'acc', gas: 400000 })).toBe(true);
            });
        });
    });
    describe('#paymentDigest', function () {
        it('returns the digest', function () {
            deployed.paymentDigest = sinon.stub().withArgs(ID, new BigNumber.BigNumber(10)).resolves('digest');
            return contract.paymentDigest(ID, new BigNumber.BigNumber(10)).then(function (digest) {
                expect(digest).toBe('digest');
            });
        });
    });
    describe('#canClaim', function () {
        it('returns whether the user can claim', function () {
            var sig = signature_1.default.fromParts({
                v: 27,
                r: '0x01',
                s: '0x02'
            });
            deployed.canClaim = sinon.stub().withArgs(ID, new BigNumber.BigNumber(10), 'recv', sig.toString()).resolves(true);
            return contract.canClaim(ID, new BigNumber.BigNumber(10), 'recv', sig).then(function (val) {
                expect(val).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=channel_contract.test.js.map