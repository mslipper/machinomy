"use strict";
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
var Web3 = require("web3");
var BigNumber = require("bignumber.js");
var express = require("express");
var bodyParser = require("body-parser");
var index_1 = require("../index");
var expect = require('expect');
var web3 = new Web3(new Web3.providers.HttpProvider(process.env.MACHINOMY_GETH_ADDR));
var sender = process.env.SENDER_ADDRESS;
var receiver = process.env.RECEIVER_ADDRESS;
describe('Buy flow', function () {
    var price = new BigNumber.BigNumber(web3.toWei(0.1, 'ether'));
    var senderOriginalBalance;
    var receiverOriginalBalance;
    var hubPort;
    var hubInstance;
    var clientInstance;
    var hubServer;
    var serverListener;
    var firstChannelId;
    before(function (done) {
        hubPort = randomPort();
        hubInstance = new index_1.default(receiver, web3, {
            databaseUrl: "nedb:///tmp/machinomy-hub-" + Date.now(),
            minimumSettlementPeriod: 0
        });
        clientInstance = new index_1.default(sender, web3, {
            settlementPeriod: 0,
            databaseUrl: "nedb:///tmp/machinomy-client-" + Date.now()
        });
        hubServer = express();
        hubServer.use(bodyParser.json());
        hubServer.use(bodyParser.urlencoded({ extended: false }));
        hubServer.post('/machinomy', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, hubInstance.acceptPayment(req.body)];
                    case 1:
                        body = _a.sent();
                        res.status(200).send(body);
                        return [2 /*return*/];
                }
            });
        }); });
        senderOriginalBalance = web3.eth.getBalance(sender);
        receiverOriginalBalance = web3.eth.getBalance(receiver);
        serverListener = hubServer.listen(hubPort, done);
    });
    after(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, hubInstance.shutdown()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, clientInstance.shutdown()];
                case 2:
                    _a.sent();
                    serverListener.close();
                    return [2 /*return*/];
            }
        });
    }); });
    describe('first buy', function () {
        var token;
        before(function () {
            return clientInstance.buy({
                receiver: receiver,
                price: price,
                gateway: "http://localhost:" + hubPort + "/machinomy",
                meta: ''
            }).then(function (res) {
                token = res.token;
                firstChannelId = res.channelId;
            });
        });
        function verifyChan(channels) {
            expect(channels.length).toBe(1);
            var chan = channels[0];
            expect(chan.sender).toBe(sender);
            expect(chan.receiver).toBe(receiver);
            expect(chan.value.eq(price.mul(10))).toBe(true);
            expect(chan.spent.toString()).toBe(price.toString());
        }
        it('should open a new channel on the sender\'s side with 10x the value as deposit and the value as spent', function () {
            return clientInstance.channels().then(verifyChan);
        });
        it('should open a new channel on the receiver\'s side with 10x the value as deposit and the value as spent', function () {
            return hubInstance.channels().then(verifyChan);
        });
        it('should reduce the sender\'s balance by the deposit', function () {
            var balance = web3.eth.getBalance(sender);
            // use greaterThan to factor in the gas cost.
            expect(senderOriginalBalance.minus(web3.toWei(1, 'ether')).greaterThan(balance)).toBe(true);
        });
        it('should not affect the receiver\'s balance', function () {
            var balance = web3.eth.getBalance(receiver);
            expect(receiverOriginalBalance.eq(balance)).toBe(true);
        });
        it('should return a valid token', function () {
            return hubInstance.acceptToken({
                token: token
            }).then(function (res) {
                expect(res.status).toBe(true);
            });
        });
    });
    describe('invalid tokens', function () {
        it('should return an invalid response', function () {
            return hubInstance.acceptToken({
                token: 'honk'
            }).then(function (res) {
                expect(res.status).toBe(false);
            });
        });
    });
    describe('subsequent buy', function () {
        var channelId;
        before(function () {
            return hubInstance.channels().then(function (channels) {
                channelId = channels[0].channelId;
            }).then(function () { return clientInstance.buy({
                receiver: receiver,
                price: price,
                gateway: "http://localhost:" + hubPort + "/machinomy",
                meta: ''
            }); });
        });
        function verifySameChannel(channels) {
            expect(channels.length).toBe(1);
            var chan = channels[0];
            expect(chan.channelId).toBe(channelId);
        }
        function verifyChannelValue(channels) {
            expect(channels.length).toBe(1);
            var chan = channels[0];
            expect(chan.spent.eq(web3.toWei(0.2, 'ether'))).toBe(true);
        }
        it('should use the same channel on the sender\'s side', function () {
            return clientInstance.channels().then(verifySameChannel);
        });
        it('should use the same channel on the receiver\'s side', function () {
            return hubInstance.channels().then(verifySameChannel);
        });
        it('should increment the channel\'s value on the sender\'s side', function () {
            return clientInstance.channels().then(verifyChannelValue);
        });
        it('should increment the channel\'s value on the receiver\'s side', function () {
            return hubInstance.channels().then(verifyChannelValue);
        });
    });
    describe('a buy whose total value is more than the channel value', function () {
        var newChannelId;
        var newPrice = price.mul(10).plus(1);
        before(function () {
            return clientInstance.buy({
                receiver: receiver,
                price: newPrice,
                gateway: "http://localhost:" + hubPort + "/machinomy",
                meta: ''
            }).then(function (res) { return (newChannelId = res.channelId); });
        });
        function verifyChan(channels) {
            expect(channels.length).toBe(2);
            var chan = channels.find(function (chan) { return (chan.channelId === newChannelId); });
            if (!chan) {
                throw new Error("Channel " + newChannelId + " not found.");
            }
            expect(chan.sender).toBe(sender);
            expect(chan.receiver).toBe(receiver);
            expect(chan.value.eq(newPrice.mul(10))).toBe(true);
            expect(chan.spent.eq(newPrice)).toBe(true);
        }
        it('opens a new channel on the sender\'s side with the right deposit and spend', function () {
            return clientInstance.channels().then(verifyChan);
        });
        it('opens a new channel on the receiver\'s side with the right deposit and spend', function () {
            return hubInstance.channels().then(verifyChan);
        });
    });
    describe('claiming a channel', function () {
        before(function () {
            return hubInstance.close(firstChannelId);
        });
        // channels() returns open channels only.
        it('marks the channel as closed for the sender', function () {
            return clientInstance.channels().then(function (channels) {
                expect(channels.find(function (chan) { return (chan.channelId === firstChannelId); })).toBe(undefined);
            });
        });
        it('marks the channel as closed for the receiver', function () {
            return hubInstance.channels().then(function (channels) {
                expect(channels.find(function (chan) { return (chan.channelId === firstChannelId); })).toBe(undefined);
            });
        });
        it('disburses whatever is left over to the sender', function () {
            var balance = web3.eth.getBalance(sender);
            expect(balance.lessThan(senderOriginalBalance.minus(web3.toWei(0.2, 'ether')))).toBe(true);
            // use 20 ether here since 0.8 ether is returned and 20 are still in deposit
            expect(balance.greaterThan(senderOriginalBalance.minus(web3.toWei(20, 'ether')))).toBe(true);
        });
        it('disburses the balance to the receiver', function () {
            var balance = web3.eth.getBalance(receiver);
            expect(balance.greaterThan(receiverOriginalBalance.plus(web3.toWei(0.19, 'ether')))).toBe(true);
        });
    });
    describe('opening a raw channel', function () {
        var channel;
        beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, clientInstance.open(receiver, new BigNumber.BigNumber(web3.toWei(0.1, 'ether')))];
                    case 1:
                        channel = _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should open a channel with the provided value', function () {
            expect(channel.value.eq(web3.toWei(0.1, 'ether'))).toBe(true);
        });
    });
});
function randomPort() {
    return 3000 + Math.floor(10000 * Math.random());
}
//# sourceMappingURL=buy_flow.test.js.map