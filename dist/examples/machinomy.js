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
var configuration = require("../lib/configuration");
var Web3 = require("web3");
var index_1 = require("../index");
var express = require("express");
var bodyParser = require("body-parser");
var fs = require('fs');
var sender = '0x0108d76118d97b88aa40167064cb242fa391effa';
var receiver = '0x3155694d7558eec974cfe35eaa3c2c7bcebb793f';
var getBalance = function (web3, account) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, web3.eth.getBalance(account)];
    });
}); };
var provider = configuration.currentProvider();
var web3 = new Web3(provider);
var machinomyHub = new index_1.default(receiver, web3, { databaseUrl: 'nedb://./hub' });
var hub = express();
hub.use(bodyParser.json());
hub.use(bodyParser.urlencoded({ extended: false }));
hub.post('/machinomy', function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
    var body;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, machinomyHub.acceptPayment(req.body)];
            case 1:
                body = _a.sent();
                res.status(200).send(body);
                return [2 /*return*/];
        }
    });
}); });
var checkBalance = function (message, web3, sender, cb) { return __awaiter(_this, void 0, void 0, function () {
    var balanceBefore, result, balanceAfter, diff;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('----------');
                console.log(message);
                return [4 /*yield*/, getBalance(web3, sender)];
            case 1:
                balanceBefore = _a.sent();
                console.log('Balance before', web3.fromWei(balanceBefore, 'mwei').toString());
                return [4 /*yield*/, cb()];
            case 2:
                result = _a.sent();
                return [4 /*yield*/, getBalance(web3, sender)];
            case 3:
                balanceAfter = _a.sent();
                console.log('Balance after', web3.fromWei(balanceAfter, 'mwei').toString());
                diff = balanceBefore.minus(balanceAfter);
                console.log('Diff', web3.fromWei(diff, 'mwei').toString());
                return [2 /*return*/, result];
        }
    });
}); };
var port = 3001;
var server = hub.listen(port, function () { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    var price, machinomy, message, resultFirst, resultSecond, channelId, resultThird;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                price = 1000000;
                machinomy = new index_1.default(sender, web3, { settlementPeriod: 0, databaseUrl: 'nedb://./client' });
                message = 'This is first buy:';
                return [4 /*yield*/, checkBalance(message, web3, sender, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, machinomy.buy({
                                    receiver: receiver,
                                    price: price,
                                    gateway: 'http://localhost:3001/machinomy',
                                    meta: 'metaexample'
                                }).catch(function (e) {
                                    console.log(e);
                                })];
                        });
                    }); })];
            case 1:
                resultFirst = _a.sent();
                message = 'This is second buy:';
                return [4 /*yield*/, checkBalance(message, web3, sender, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, machinomy.buy({
                                    receiver: receiver,
                                    price: price,
                                    gateway: 'http://localhost:3001/machinomy',
                                    meta: 'metaexample'
                                }).catch(function (e) {
                                    console.log(e);
                                })];
                        });
                    }); })];
            case 2:
                resultSecond = _a.sent();
                channelId = resultSecond.channelId;
                message = 'Deposit:';
                return [4 /*yield*/, checkBalance(message, web3, sender, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, machinomy.deposit(channelId, price)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 3:
                _a.sent();
                message = 'First close:';
                return [4 /*yield*/, checkBalance(message, web3, sender, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, machinomy.close(channelId)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 4:
                _a.sent();
                message = 'Second close:';
                return [4 /*yield*/, checkBalance(message, web3, sender, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, machinomy.close(channelId)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 5:
                _a.sent();
                message = 'Once more buy';
                return [4 /*yield*/, checkBalance(message, web3, sender, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, machinomy.buy({
                                    receiver: receiver,
                                    price: price,
                                    gateway: 'http://localhost:3001/machinomy',
                                    meta: 'metaexample'
                                }).catch(function (e) {
                                    console.log(e);
                                })];
                        });
                    }); })];
            case 6:
                resultThird = _a.sent();
                message = 'Claim by reciver';
                return [4 /*yield*/, checkBalance(message, web3, sender, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, machinomyHub.close(resultThird.channelId)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 7:
                _a.sent();
                console.log('ChannelId after first buy:', resultFirst.channelId);
                console.log('ChannelId after second buy:', resultSecond.channelId);
                console.log('ChannelId after once more buy:', resultThird.channelId);
                server.close();
                try {
                    fs.unlinkSync('client');
                }
                catch (error) {
                    console.log(error);
                }
                try {
                    fs.unlinkSync('hub');
                }
                catch (error) {
                    console.log(error);
                }
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=machinomy.js.map