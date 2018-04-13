"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid");
const BigNumber = require("bignumber.js");
const sinon = require("sinon");
const contracts_1 = require("@machinomy/contracts");
const channel_contract_1 = require("../lib/channel_contract");
const signature_1 = require("../lib/signature");
const expect = require('expect');
describe('ChannelContract', () => {
    const ID = '0e29e61f256b40b2a6280f8181a1b5ff';
    const SIG = signature_1.default.fromRpcSig('0xd8a923b39ae82bb39d3b64d58f06e1d776bcbcae34e5b4a6f4a952e8892e6a5b4c0f88833c06fe91729057035161e599fda536e8ce0ab4be2c214d6ea961e93a01');
    let web3;
    let deployed;
    let contractStub;
    let uuidStub;
    let contract;
    beforeEach(() => {
        web3 = {
            currentProvider: {},
            eth: {
                getGasPrice(cb) {
                    cb(null, new BigNumber.BigNumber(1234));
                }
            }
        };
        deployed = {};
        uuidStub = sinon.stub(uuid, 'v4').returns('0e29e61f-256b-40b2-a628-0f8181a1b5ff');
        contractStub = sinon.stub(contracts_1.Unidirectional, 'contract');
        contractStub.withArgs(web3.currentProvider).returns({
            deployed: sinon.stub().resolves(deployed)
        });
        contract = new channel_contract_1.default(web3);
    });
    afterEach(() => {
        contractStub.restore();
        uuidStub.restore();
    });
    describe('#open', () => {
        it('opens a channel with the correct id, sender, receiver, settlement period, price, and gas params', () => {
            deployed.open = sinon.stub();
            return contract.open('send', 'recv', new BigNumber.BigNumber(10), 1234, ID).then(() => {
                expect(deployed.open.calledWith(ID, 'recv', 1234, {
                    from: 'send',
                    value: new BigNumber.BigNumber(10),
                    gas: 300000,
                    gasPrice: new BigNumber.BigNumber(1234)
                })).toBe(true);
            });
        });
    });
    describe('#claim', () => {
        it('claims the channel', () => {
            deployed.claim = sinon.stub();
            return contract.claim('recv', ID, new BigNumber.BigNumber(10), SIG).then(() => {
                expect(deployed.claim.calledWith(ID, new BigNumber.BigNumber(10), SIG.toString(), {
                    from: 'recv',
                    gasPrice: new BigNumber.BigNumber(1234)
                })).toBe(true);
            });
        });
    });
    describe('#deposit', () => {
        it('deposits money into the channel', () => {
            deployed.deposit = sinon.stub();
            return contract.deposit('send', ID, new BigNumber.BigNumber(10)).then(() => {
                expect(deployed.deposit.calledWith(ID, {
                    from: 'send',
                    value: new BigNumber.BigNumber(10),
                    gas: 300000,
                    gasPrice: new BigNumber.BigNumber(1234)
                })).toBe(true);
            });
        });
    });
    describe('#getState', () => {
        it('returns 0 if the channel is open', () => {
            deployed.isOpen = sinon.stub().withArgs(ID).resolves(true);
            deployed.isSettling = sinon.stub().withArgs(ID).resolves(false);
            return contract.getState(ID).then((state) => {
                expect(state).toBe(0);
            });
        });
        it('returns 1 if the channel is settling', () => {
            deployed.isOpen = sinon.stub().withArgs(ID).resolves(false);
            deployed.isSettling = sinon.stub().withArgs(ID).resolves(true);
            return contract.getState(ID).then((state) => {
                expect(state).toBe(1);
            });
        });
    });
    describe('#startSettle', () => {
        it('starts settling the channel', () => {
            deployed.startSettling = sinon.stub();
            return contract.startSettle('acc', ID).then(() => {
                expect(deployed.startSettling.calledWith(ID, {
                    from: 'acc',
                    gasPrice: new BigNumber.BigNumber(1234)
                })).toBe(true);
            });
        });
    });
    describe('#finishSettle', () => {
        it('finishes settling the channel', () => {
            deployed.settle = sinon.stub();
            return contract.finishSettle('acc', ID).then(() => {
                expect(deployed.settle.calledWith(ID, {
                    from: 'acc',
                    gas: 400000,
                    gasPrice: new BigNumber.BigNumber(1234)
                })).toBe(true);
            });
        });
    });
    describe('#paymentDigest', () => {
        it('returns the digest', () => {
            deployed.paymentDigest = sinon.stub().withArgs(ID, new BigNumber.BigNumber(10)).resolves('digest');
            return contract.paymentDigest(ID, new BigNumber.BigNumber(10)).then((digest) => {
                expect(digest).toBe('digest');
            });
        });
    });
    describe('#canClaim', () => {
        it('returns whether the user can claim', () => {
            const sig = signature_1.default.fromParts({
                v: 27,
                r: '0x01',
                s: '0x02'
            });
            deployed.canClaim = sinon.stub().withArgs(ID, new BigNumber.BigNumber(10), 'recv', sig.toString()).resolves(true);
            return contract.canClaim(ID, new BigNumber.BigNumber(10), 'recv', sig).then((val) => {
                expect(val).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=channel_contract.test.js.map