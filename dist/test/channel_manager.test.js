"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
// line below is false positive
// tslint:disable-next-line
const BigNumber = require("bignumber.js");
const channel_manager_1 = require("../lib/channel_manager");
const payment_channel_1 = require("../lib/payment_channel");
const payment_1 = require("../lib/payment");
const expects_rejection_1 = require("./util/expects_rejection");
const channel_contract_1 = require("../lib/channel_contract");
const signature_1 = require("../lib/signature");
const uuid = require("uuid");
const contracts_1 = require("@machinomy/contracts");
const expect = require('expect');
describe('ChannelManagerImpl', () => {
    const fakeChan = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', '123', new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 0, undefined);
    const fakeLog = {
        logs: [{
                args: {
                    channelId: '123'
                }
            }]
    };
    let web3;
    let channelsDao;
    let paymentsDao;
    let tokensDao;
    let channelContract;
    let channelManager;
    let paymentManager;
    let deployed;
    let contractStub;
    let uuidStub;
    let machOpts;
    beforeEach(() => {
        web3 = {
            currentProvider: {}
        };
        deployed = {};
        uuidStub = sinon.stub(uuid, 'v4').returns('0e29e61f-256b-40b2-a628-0f8181a1b5ff');
        contractStub = sinon.stub(contracts_1.Unidirectional, 'contract');
        contractStub.withArgs(web3.currentProvider).returns({
            deployed: sinon.stub().resolves(deployed)
        });
        paymentsDao = {};
        tokensDao = {};
        channelsDao = {};
        paymentManager = {};
        machOpts = {
            settlementPeriod: channel_manager_1.DEFAULT_SETTLEMENT_PERIOD + 1,
            closeOnInvalidPayment: true
        };
        channelContract = new channel_contract_1.default(web3);
        channelManager = new channel_manager_1.ChannelManagerImpl('0xcafe', web3, channelsDao, paymentsDao, tokensDao, channelContract, paymentManager, machOpts);
    });
    afterEach(() => {
        contractStub.restore();
        uuidStub.restore();
    });
    describe('openChannel', () => {
        beforeEach(() => {
            channelsDao.save = sinon.stub().resolves();
            channelContract.open = sinon.stub().resolves(fakeLog);
        });
        it('puts a new channel on the blockchain', () => {
            return channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(10))
                .then(() => {
                expect(channelContract.open
                    .calledWith('0xcafe', '0xbeef', new BigNumber.BigNumber(100), channel_manager_1.DEFAULT_SETTLEMENT_PERIOD + 1))
                    .toBe(true);
            });
        });
        it('saves the new payment channel in the database', () => {
            return channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(1))
                .then(() => {
                expect(channelsDao.save.calledWith(fakeChan)).toBe(true);
            });
        });
        it('emits willOpenChannel and didOpenChannel', () => {
            const will = sinon.stub();
            const did = sinon.stub();
            channelManager.addListener('willOpenChannel', will);
            channelManager.addListener('didOpenChannel', did);
            const promise = channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(1));
            expect(will.calledWith('0xcafe', '0xbeef', new BigNumber.BigNumber(10))).toBe(true);
            expect(did.called).toBe(false);
            return promise.then(() => {
                expect(did.calledWith(fakeChan)).toBe(true);
            });
        });
        it('only allows one call at once', () => {
            const order = [];
            return Promise.all([
                channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(10)).then(() => order.push(1)),
                channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(10)).then(() => order.push(2)),
                channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(10)).then(() => order.push(3))
            ]).then(() => expect(order).toEqual([1, 2, 3]));
        });
    });
    describe('closeChannel', () => {
        const id = '0xbeef';
        const startSettleResult = {};
        const finishSettleResult = {};
        const claimResult = {};
        beforeEach(() => {
            channelContract.startSettle = sinon.stub().resolves(startSettleResult);
            channelContract.finishSettle = sinon.stub().resolves(finishSettleResult);
            deployed.channels = sinon.stub().resolves(['0', '0',
                new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), new BigNumber.BigNumber(0)]);
        });
        it('throws an error when no channels are found', () => {
            channelsDao.firstById = sinon.stub().resolves(null);
            return expects_rejection_1.default(channelManager.closeChannel('nope'));
        });
        it('throws an error if the channel is already settled', () => {
            channelsDao.firstById = sinon.stub().resolves(fakeChan);
            channelContract.getState = sinon.stub().resolves(2);
            return expects_rejection_1.default(channelManager.closeChannel(id));
        });
        it('starts settling the contract when the sender is the current account and state is 0', () => {
            const channel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 0, undefined);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(channel);
            channelContract.getState = sinon.stub().resolves(0);
            channelsDao.updateState = sinon.stub().withArgs(id, 1).resolves();
            return channelManager.closeChannel(id).then((res) => {
                expect(res).toBe(startSettleResult);
                expect(channelsDao.updateState.calledWith(id, 1)).toBe(true);
            });
        });
        it('finishes settling the contract when the sender is the current account and state is 1', () => {
            const channel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 1, undefined);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(channel);
            channelContract.getState = sinon.stub().resolves(1);
            channelsDao.updateState = sinon.stub().withArgs(id, 2).resolves();
            return channelManager.closeChannel(id).then((res) => {
                expect(res).toBe(finishSettleResult);
                expect(channelsDao.updateState.calledWith(id, 2)).toBe(true);
            });
        });
        it('claims the contract when the sender is not the current account', () => {
            const channel = new payment_channel_1.PaymentChannel('0xdead', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 1, undefined);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(channel);
            paymentsDao.firstMaximum = sinon.stub().withArgs(id).resolves(new payment_1.default({
                channelId: id,
                sender: channel.sender,
                receiver: channel.receiver,
                price: channel.spent,
                value: channel.value,
                channelValue: channel.value,
                signature: signature_1.default.fromParts({
                    v: 27,
                    r: '0x01',
                    s: '0x02'
                }),
                meta: '',
                token: undefined,
                contractAddress: undefined
            }));
            channelContract.claim = sinon.stub().withArgs(channel.receiver, channel, channel.value, 1, '0x01', '0x02')
                .resolves(claimResult);
            channelsDao.updateState = sinon.stub().withArgs(id, 2).resolves();
            return channelManager.closeChannel(id).then((res) => {
                expect(res).toBe(claimResult);
                expect(channelsDao.updateState.calledWith(id, 2)).toBe(true);
            });
        });
        it('emits willCloseChannel and didCloseChannel', () => {
            const channel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 0, undefined);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(channel);
            channelContract.getState = sinon.stub().resolves(0);
            channelsDao.updateState = sinon.stub().withArgs(id, 1).resolves();
            const will = sinon.stub();
            const did = sinon.stub();
            channelManager.addListener('willCloseChannel', will);
            channelManager.addListener('didCloseChannel', did);
            return channelManager.closeChannel(id).then((res) => {
                expect(will.calledWith(channel)).toBe(true);
                expect(did.calledWith(channel)).toBe(true);
            });
        });
        it('only allows one call at once', () => {
            const channel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 0, undefined);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(channel);
            channelContract.getState = sinon.stub().resolves(0);
            channelsDao.updateState = sinon.stub().withArgs(id, 1).resolves();
            const order = [];
            return Promise.all([
                channelManager.closeChannel(id).then(() => order.push(1)),
                channelManager.closeChannel(id).then(() => order.push(2)),
                channelManager.closeChannel(id).then(() => order.push(3))
            ]).then(() => expect(order).toEqual([1, 2, 3]));
        });
        describe('not in DB but on-chain channels', () => {
            let savedChannel;
            function setup(settlingUntil) {
                savedChannel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 0, undefined);
                channelsDao.firstById = sinon.stub().withArgs(id).resolves(null);
                channelContract.channelById = sinon.stub().withArgs(id).resolves([savedChannel.sender, savedChannel.receiver, savedChannel.value, channel_manager_1.DEFAULT_SETTLEMENT_PERIOD, new BigNumber.BigNumber(settlingUntil)]);
                channelContract.claim = sinon.stub().resolves(claimResult);
                channelsDao.save = sinon.stub().resolves();
                channelContract.getState = sinon.stub().resolves(0);
                channelsDao.updateState = sinon.stub().withArgs(id, 1).resolves();
            }
            beforeEach(() => {
                setup(0);
                return channelManager.closeChannel(id);
            });
            it('should close channels that exist on-chain but not in the database', () => {
                expect(channelContract.channelById.calledWith(id));
            });
            it('should save the channel in the database', () => {
                expect(channelsDao.save.lastCall.args[0]).toEqual(savedChannel);
            });
            it('should set the state correctly based on the settlingUntil parameter', async () => {
                setup(1);
                await channelManager.closeChannel(id);
                expect(channelsDao.save.lastCall.args[0])
                    .toEqual(new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 1, undefined));
            });
        });
    });
    describe('deposit', () => {
        let id = '0xdead';
        beforeEach(() => {
            deployed.channels = sinon.stub().resolves(['0', '0',
                new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), new BigNumber.BigNumber(0)]);
        });
        it('should throw an error if no channel is found', () => {
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(null);
            return expects_rejection_1.default(channelManager.deposit(id, new BigNumber.BigNumber(6)));
        });
        it('should not update the database if depositing into the channel contract fails', () => {
            channelsDao.firstById = sinon.stub().withArgs(id).resolves({});
            channelsDao.deposit = sinon.stub();
            channelContract.deposit = sinon.stub().rejects('oh no');
            return expects_rejection_1.default(channelManager.deposit(id, new BigNumber.BigNumber(1))).then(() => {
                expect(channelsDao.deposit.notCalled).toBe(true);
            });
        });
        it('should return a transaction receipt on success', () => {
            const value = new BigNumber.BigNumber(10);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves({});
            channelsDao.deposit = sinon.stub().withArgs('0xcafe', id, new BigNumber.BigNumber(10)).resolves();
            channelContract.deposit = sinon.stub().resolves({ tx: '123abc' });
            return channelManager.deposit(id, value).then((res) => {
                expect(res.tx).toEqual('123abc');
            });
        });
    });
    describe('nextPayment', () => {
        const id = '0xdead';
        let channel;
        beforeEach(() => {
            channel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(10), new BigNumber.BigNumber(2), 0, undefined);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(channel);
            deployed.channels = sinon.stub().resolves(['0', '0',
                new BigNumber.BigNumber(8), new BigNumber.BigNumber(0), new BigNumber.BigNumber(0)]);
        });
        it('should throw an error if no channel is found', () => {
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(null);
            return expects_rejection_1.default(channelManager.nextPayment(id, new BigNumber.BigNumber(6), ''));
        });
        it('should throw an error if the amount to spend is more than the remaining channel value', () => {
            return expects_rejection_1.default(channelManager.nextPayment(id, new BigNumber.BigNumber(9), ''));
        });
        it('should return a new payment whose spend is the sum of the existing spend plus amount', () => {
            paymentManager.buildPaymentForChannel = sinon.stub().withArgs(channel, sinon.match.object, sinon.match.object, '').callsFake((channel, price, value, meta) => {
                return new payment_1.default({
                    channelId: channel.channelId,
                    sender: 'send',
                    receiver: 'recv',
                    price,
                    value,
                    channelValue: new BigNumber.BigNumber(100),
                    signature: signature_1.default.fromParts({
                        v: 27,
                        r: '0x01',
                        s: '0x02'
                    }),
                    meta,
                    contractAddress: undefined,
                    token: undefined
                });
            });
            deployed.channels = sinon.stub().resolves(['0', '0',
                new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), new BigNumber.BigNumber(0)]);
            return channelManager.nextPayment(id, new BigNumber.BigNumber(8), '').then((payment) => {
                expect(payment.value.eq(new BigNumber.BigNumber(10))).toBe(true);
                expect(payment.price.eq(new BigNumber.BigNumber(8))).toBe(true);
            });
        });
    });
    describe('spendChannel', () => {
        it('should save the channel in the database', () => {
            const payment = new payment_1.default({
                channelId: '0xdead',
                sender: 'send',
                receiver: 'recv',
                price: new BigNumber.BigNumber(10),
                value: new BigNumber.BigNumber(10),
                channelValue: new BigNumber.BigNumber(100),
                signature: signature_1.default.fromParts({
                    v: 27,
                    r: '0x01',
                    s: '0x02'
                }),
                meta: '',
                contractAddress: undefined,
                token: undefined
            });
            channelsDao.saveOrUpdate = sinon.stub().resolves();
            return channelManager.spendChannel(payment).then(() => {
                expect(channelsDao.saveOrUpdate.calledWith({
                    sender: 'send',
                    receiver: 'recv',
                    channelId: '0xdead',
                    value: new BigNumber.BigNumber(10),
                    spent: new BigNumber.BigNumber(10),
                    state: undefined,
                    contractAddress: undefined
                }));
            });
        });
    });
    describe('acceptPayment', () => {
        let payment;
        beforeEach(() => {
            const id = '0xdead';
            payment = {
                channelId: id,
                sender: '0xcafe',
                receiver: '0xbeef',
                price: new BigNumber.BigNumber(1),
                value: new BigNumber.BigNumber(1),
                channelValue: new BigNumber.BigNumber(10),
                signature: signature_1.default.fromParts({
                    v: 27,
                    r: '0x01',
                    s: '0x02'
                }),
                meta: '',
                contractAddress: undefined,
                token: ''
            };
            deployed.channels = sinon.stub().resolves(['0', '0',
                new BigNumber.BigNumber(8), new BigNumber.BigNumber(0), new BigNumber.BigNumber(0)]);
            channelsDao.findBySenderReceiverChannelId = sinon.stub().resolves(null);
        });
        it('should save the payment to the database and return the token when valid', () => {
            web3.sha3 = sinon.stub().returns('token');
            channelsDao.saveOrUpdate = sinon.stub().withArgs(channelsDao).resolves();
            tokensDao.save = sinon.stub().withArgs('token', payment.channelId).resolves();
            paymentsDao.save = sinon.stub().withArgs('token', payment).resolves();
            paymentManager.isValid = sinon.stub().resolves(true);
            return channelManager.acceptPayment(payment).then((token) => {
                expect(token).toBe('token');
            });
        });
        function testNextPayment() {
            const signature = signature_1.default.fromParts({
                v: 27,
                r: '0x02',
                s: '0x03'
            });
            const newChan = Object.assign({}, fakeChan, { sender: '0xbeef', channelId: '456' });
            paymentManager.isValid = sinon.stub().resolves(false);
            channelsDao.findBySenderReceiverChannelId = sinon.stub().resolves(newChan);
            paymentsDao.firstMaximum = sinon.stub().resolves({
                price: new BigNumber.BigNumber(1),
                value: new BigNumber.BigNumber(0.5),
                signature
            });
            channelContract.claim = sinon.stub().resolves({});
            channelContract.getState = sinon.stub().resolves(0);
            channelsDao.updateState = sinon.stub().resolves();
            channelsDao.firstById = sinon.stub().withArgs(newChan.channelId).resolves(newChan);
            return expects_rejection_1.default(channelManager.acceptPayment(payment))
                .then(() => ({ signature, newChan }));
        }
        it('should close the channel if the payment is invalid and a channel exists', () => {
            return testNextPayment()
                .then((res) => expect(channelContract.claim
                .calledWith(fakeChan.receiver, res.newChan.channelId, new BigNumber.BigNumber(0.5), res.signature)).toBe(true));
        });
        it('should not close the channel if options.closeOnInvalidPayment is false', () => {
            machOpts.closeOnInvalidPayment = false;
            return testNextPayment()
                .then(() => expect(channelContract.claim.notCalled).toBe(true));
        });
    });
    describe('requireOpenChannel', () => {
        beforeEach(() => {
            channelsDao.save = sinon.stub().resolves();
            channelContract.open = sinon.stub().resolves(fakeLog);
        });
        it('returns any usable channels if found', () => {
            channelsDao.findUsable = sinon.stub().resolves(fakeChan);
            return channelManager.requireOpenChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(1))
                .then((chan) => {
                expect(chan).toEqual(fakeChan);
                expect(channelContract.open.called).toBe(false);
            });
        });
        it('creates a new channel if no usable channels are found', () => {
            channelsDao.findUsable = sinon.stub().resolves(null);
            return channelManager.requireOpenChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(1))
                .then((chan) => {
                expect(chan).toEqual(fakeChan);
                expect(channelContract.open.called).toBe(true);
                expect(channelsDao.save.calledWith(fakeChan)).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=channel_manager.test.js.map