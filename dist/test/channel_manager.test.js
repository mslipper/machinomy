"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var sinon = require("sinon");
// line below is false positive
// tslint:disable-next-line
var BigNumber = require("bignumber.js");
var channel_manager_1 = require("../lib/channel_manager");
var payment_channel_1 = require("../lib/payment_channel");
var payment_1 = require("../lib/payment");
var expects_rejection_1 = require("./util/expects_rejection");
var channel_contract_1 = require("../lib/channel_contract");
var signature_1 = require("../lib/signature");
var uuid = require("uuid");
var contracts_1 = require("@machinomy/contracts");
var expect = require('expect');
describe('ChannelManagerImpl', function () {
    var fakeChan = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', '123', new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 0, undefined);
    var fakeLog = {
        logs: [{
                args: {
                    channelId: '123'
                }
            }]
    };
    var web3;
    var channelsDao;
    var paymentsDao;
    var tokensDao;
    var channelContract;
    var channelManager;
    var paymentManager;
    var deployed;
    var contractStub;
    var uuidStub;
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
        paymentsDao = {};
        tokensDao = {};
        channelsDao = {};
        paymentManager = {};
        channelContract = new channel_contract_1.default(web3);
        channelManager = new channel_manager_1.ChannelManagerImpl('0xcafe', web3, channelsDao, paymentsDao, tokensDao, channelContract, paymentManager, {
            settlementPeriod: channel_manager_1.DEFAULT_SETTLEMENT_PERIOD + 1
        });
    });
    afterEach(function () {
        contractStub.restore();
        uuidStub.restore();
    });
    describe('openChannel', function () {
        beforeEach(function () {
            channelsDao.save = sinon.stub().resolves();
            channelContract.open = sinon.stub().resolves(fakeLog);
        });
        it('puts a new channel on the blockchain', function () {
            return channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(10))
                .then(function () {
                expect(channelContract.open
                    .calledWith('0xcafe', '0xbeef', new BigNumber.BigNumber(100), channel_manager_1.DEFAULT_SETTLEMENT_PERIOD + 1))
                    .toBe(true);
            });
        });
        it('saves the new payment channel in the database', function () {
            return channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(1))
                .then(function () {
                expect(channelsDao.save.calledWith(fakeChan)).toBe(true);
            });
        });
        it('emits willOpenChannel and didOpenChannel', function () {
            var will = sinon.stub();
            var did = sinon.stub();
            channelManager.addListener('willOpenChannel', will);
            channelManager.addListener('didOpenChannel', did);
            var promise = channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(1));
            expect(will.calledWith('0xcafe', '0xbeef', new BigNumber.BigNumber(10))).toBe(true);
            expect(did.called).toBe(false);
            return promise.then(function () {
                expect(did.calledWith(fakeChan)).toBe(true);
            });
        });
        it('only allows one call at once', function () {
            var order = [];
            return Promise.all([
                channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(10)).then(function () { return order.push(1); }),
                channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(10)).then(function () { return order.push(2); }),
                channelManager.openChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(10)).then(function () { return order.push(3); })
            ]).then(function () { return expect(order).toEqual([1, 2, 3]); });
        });
    });
    describe('closeChannel', function () {
        var id = '0xbeef';
        var startSettleResult = {};
        var finishSettleResult = {};
        var claimResult = {};
        beforeEach(function () {
            channelContract.startSettle = sinon.stub().resolves(startSettleResult);
            channelContract.finishSettle = sinon.stub().resolves(finishSettleResult);
            deployed.channels = sinon.stub().resolves(['0', '0',
                new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), new BigNumber.BigNumber(0)]);
        });
        it('throws an error when no channels are found', function () {
            channelsDao.firstById = sinon.stub().resolves(null);
            return expects_rejection_1.default(channelManager.closeChannel('nope'));
        });
        it('throws an error if the channel is already settled', function () {
            channelsDao.firstById = sinon.stub().resolves(fakeChan);
            channelContract.getState = sinon.stub().resolves(2);
            return expects_rejection_1.default(channelManager.closeChannel(id));
        });
        it('starts settling the contract when the sender is the current account and state is 0', function () {
            var channel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 0, undefined);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(channel);
            channelContract.getState = sinon.stub().resolves(0);
            channelsDao.updateState = sinon.stub().withArgs(id, 1).resolves();
            return channelManager.closeChannel(id).then(function (res) {
                expect(res).toBe(startSettleResult);
                expect(channelsDao.updateState.calledWith(id, 1)).toBe(true);
            });
        });
        it('finishes settling the contract when the sender is the current account and state is 1', function () {
            var channel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 1, undefined);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(channel);
            channelContract.getState = sinon.stub().resolves(1);
            channelsDao.updateState = sinon.stub().withArgs(id, 2).resolves();
            return channelManager.closeChannel(id).then(function (res) {
                expect(res).toBe(finishSettleResult);
                expect(channelsDao.updateState.calledWith(id, 2)).toBe(true);
            });
        });
        it('claims the contract when the sender is not the current account', function () {
            var channel = new payment_channel_1.PaymentChannel('0xdead', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 1, undefined);
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
            return channelManager.closeChannel(id).then(function (res) {
                expect(res).toBe(claimResult);
                expect(channelsDao.updateState.calledWith(id, 2)).toBe(true);
            });
        });
        it('emits willCloseChannel and didCloseChannel', function () {
            var channel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 0, undefined);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(channel);
            channelContract.getState = sinon.stub().resolves(0);
            channelsDao.updateState = sinon.stub().withArgs(id, 1).resolves();
            var will = sinon.stub();
            var did = sinon.stub();
            channelManager.addListener('willCloseChannel', will);
            channelManager.addListener('didCloseChannel', did);
            return channelManager.closeChannel(id).then(function (res) {
                expect(will.calledWith(channel)).toBe(true);
                expect(did.calledWith(channel)).toBe(true);
            });
        });
        it('only allows one call at once', function () {
            var channel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 0, undefined);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(channel);
            channelContract.getState = sinon.stub().resolves(0);
            channelsDao.updateState = sinon.stub().withArgs(id, 1).resolves();
            var order = [];
            return Promise.all([
                channelManager.closeChannel(id).then(function () { return order.push(1); }),
                channelManager.closeChannel(id).then(function () { return order.push(2); }),
                channelManager.closeChannel(id).then(function () { return order.push(3); })
            ]).then(function () { return expect(order).toEqual([1, 2, 3]); });
        });
        describe('not in DB but on-chain channels', function () {
            var savedChannel;
            function setup(settlingUntil) {
                savedChannel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 0, undefined);
                channelsDao.firstById = sinon.stub().withArgs(id).resolves(null);
                channelContract.channelById = sinon.stub().withArgs(id).resolves([savedChannel.sender, savedChannel.receiver, savedChannel.value, channel_manager_1.DEFAULT_SETTLEMENT_PERIOD, new BigNumber.BigNumber(settlingUntil)]);
                channelContract.claim = sinon.stub().resolves(claimResult);
                channelsDao.save = sinon.stub().resolves();
                channelContract.getState = sinon.stub().resolves(0);
                channelsDao.updateState = sinon.stub().withArgs(id, 1).resolves();
            }
            beforeEach(function () {
                setup(0);
                return channelManager.closeChannel(id);
            });
            it('should close channels that exist on-chain but not in the database', function () {
                expect(channelContract.channelById.calledWith(id));
            });
            it('should save the channel in the database', function () {
                expect(channelsDao.save.lastCall.args[0]).toEqual(savedChannel);
            });
            it('should set the state correctly based on the settlingUntil parameter', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setup(1);
                            return [4 /*yield*/, channelManager.closeChannel(id)];
                        case 1:
                            _a.sent();
                            expect(channelsDao.save.lastCall.args[0])
                                .toEqual(new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(1), new BigNumber.BigNumber(0), 1, undefined));
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    describe('deposit', function () {
        var id = '0xdead';
        it('should throw an error if no channel is found', function () {
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(null);
            return expects_rejection_1.default(channelManager.deposit(id, new BigNumber.BigNumber(6)));
        });
        it('should not update the database if depositing into the channel contract fails', function () {
            channelsDao.firstById = sinon.stub().withArgs(id).resolves({});
            channelsDao.deposit = sinon.stub();
            channelContract.deposit = sinon.stub().rejects('oh no');
            return expects_rejection_1.default(channelManager.deposit(id, new BigNumber.BigNumber(1))).then(function () {
                expect(channelsDao.deposit.notCalled).toBe(true);
            });
        });
        it('should return a transaction receipt on success', function () {
            var value = new BigNumber.BigNumber(10);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves({});
            channelsDao.deposit = sinon.stub().withArgs('0xcafe', id, new BigNumber.BigNumber(10)).resolves();
            channelContract.deposit = sinon.stub().resolves({ tx: '123abc' });
            return channelManager.deposit(id, value).then(function (res) {
                expect(res.tx).toEqual('123abc');
            });
        });
    });
    describe('nextPayment', function () {
        var id = '0xdead';
        var channel;
        beforeEach(function () {
            channel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(10), new BigNumber.BigNumber(2), 0, undefined);
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(channel);
            deployed.channels = sinon.stub().resolves(['0', '0',
                new BigNumber.BigNumber(8), new BigNumber.BigNumber(0), new BigNumber.BigNumber(0)]);
        });
        it('should throw an error if no channel is found', function () {
            channelsDao.firstById = sinon.stub().withArgs(id).resolves(null);
            return expects_rejection_1.default(channelManager.nextPayment(id, new BigNumber.BigNumber(6), ''));
        });
        it('should throw an error if the amount to spend is more than the remaining channel value', function () {
            return expects_rejection_1.default(channelManager.nextPayment(id, new BigNumber.BigNumber(9), ''));
        });
        it('should return a new payment whose spend is the sum of the existing spend plus amount', function () {
            paymentManager.buildPaymentForChannel = sinon.stub().withArgs(channel, sinon.match.object, sinon.match.object, '').callsFake(function (channel, price, value, meta) {
                return new payment_1.default({
                    channelId: channel.channelId,
                    sender: 'send',
                    receiver: 'recv',
                    price: price,
                    value: value,
                    channelValue: new BigNumber.BigNumber(100),
                    signature: signature_1.default.fromParts({
                        v: 27,
                        r: '0x01',
                        s: '0x02'
                    }),
                    meta: meta,
                    contractAddress: undefined,
                    token: undefined
                });
            });
            channelsDao.saveOrUpdate = sinon.stub().resolves();
            deployed.channels = sinon.stub().resolves(['0', '0',
                new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), new BigNumber.BigNumber(0)]);
            return channelManager.nextPayment(id, new BigNumber.BigNumber(8), '').then(function (payment) {
                expect(channelsDao.saveOrUpdate.called).toBe(true);
                expect(payment.value.eq(new BigNumber.BigNumber(10))).toBe(true);
                expect(payment.price.eq(new BigNumber.BigNumber(8))).toBe(true);
            });
        });
    });
    describe('acceptPayment', function () {
        var channel;
        var payment;
        beforeEach(function () {
            var id = '0xdead';
            payment = {
                channelId: id,
                sender: '0xcafe',
                receiver: '0xbeef',
                price: new BigNumber.BigNumber(1),
                value: new BigNumber.BigNumber(2),
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
            channel = new payment_channel_1.PaymentChannel('0xcafe', '0xbeef', id, new BigNumber.BigNumber(10), new BigNumber.BigNumber(2), 0, undefined);
            deployed.channels = sinon.stub().resolves(['0', '0',
                new BigNumber.BigNumber(8), new BigNumber.BigNumber(0), new BigNumber.BigNumber(0)]);
        });
        it('should save the payment to the database and return the token when valid', function () {
            web3.sha3 = sinon.stub().returns('token');
            channelsDao.saveOrUpdate = sinon.stub().withArgs(channelsDao).resolves();
            tokensDao.save = sinon.stub().withArgs('token', payment.channelId).resolves();
            paymentsDao.save = sinon.stub().withArgs('token', payment).resolves();
            paymentManager.isValid = sinon.stub().resolves(true);
            return channelManager.acceptPayment(payment).then(function (token) {
                expect(token).toBe('token');
            });
        });
        it('should close the channel if the payment is invalid and a channel exists', function () {
            var signature = signature_1.default.fromParts({
                v: 27,
                r: '0x02',
                s: '0x03'
            });
            var newChan = __assign({}, fakeChan, { sender: '0xbeef', channelId: '456' });
            paymentManager.isValid = sinon.stub().resolves(false);
            channelsDao.findBySenderReceiverChannelId = sinon.stub().resolves(newChan);
            paymentsDao.firstMaximum = sinon.stub().resolves({
                price: new BigNumber.BigNumber(1),
                value: new BigNumber.BigNumber(0.5),
                signature: signature
            });
            channelContract.claim = sinon.stub().resolves({});
            channelContract.getState = sinon.stub().resolves(0);
            channelsDao.updateState = sinon.stub().resolves();
            channelsDao.firstById = sinon.stub().withArgs(newChan.channelId).resolves(newChan);
            return expects_rejection_1.default(channelManager.acceptPayment(payment))
                .then(function () { return expect(channelContract.claim
                .calledWith(fakeChan.receiver, newChan.channelId, new BigNumber.BigNumber(0.5), signature)).toBe(true); });
        });
    });
    describe('requireOpenChannel', function () {
        beforeEach(function () {
            channelsDao.save = sinon.stub().resolves();
            channelContract.open = sinon.stub().resolves(fakeLog);
        });
        it('returns any usable channels if found', function () {
            channelsDao.findUsable = sinon.stub().resolves(fakeChan);
            return channelManager.requireOpenChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(1))
                .then(function (chan) {
                expect(chan).toEqual(fakeChan);
                expect(channelContract.open.called).toBe(false);
            });
        });
        it('creates a new channel if no usable channels are found', function () {
            channelsDao.findUsable = sinon.stub().resolves(null);
            return channelManager.requireOpenChannel('0xcafe', '0xbeef', new BigNumber.BigNumber(1))
                .then(function (chan) {
                expect(chan).toEqual(fakeChan);
                expect(channelContract.open.called).toBe(true);
                expect(channelsDao.save.calledWith(fakeChan)).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=channel_manager.test.js.map