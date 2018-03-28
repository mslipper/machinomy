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
var expects_rejection_1 = require("../test/util/expects_rejection");
var expect = require('expect');
var web3 = new Web3(new Web3.providers.HttpProvider(process.env.MACHINOMY_GETH_ADDR));
var sender = process.env.SENDER_ADDRESS;
var receiver = process.env.RECEIVER_ADDRESS;
describe('Payment validation flow', function () {
    var price = new BigNumber.BigNumber(web3.toWei(0.1, 'ether'));
    var hubPort;
    var hubInstance;
    var clientInstance;
    var hubServer;
    var serverListener;
    describe('minimum settlement period', function () {
        before(function (done) {
            hubPort = randomPort();
            hubInstance = new index_1.default(receiver, web3, {
                databaseUrl: "nedb:///tmp/machinomy-hub-" + Date.now(),
                minimumSettlementPeriod: 10
            });
            clientInstance = new index_1.default(sender, web3, {
                settlementPeriod: 0,
                databaseUrl: "nedb:///tmp/machinomy-client-" + Date.now()
            });
            hubServer = express();
            hubServer.use(bodyParser.json());
            hubServer.use(bodyParser.urlencoded({ extended: false }));
            hubServer.post('/machinomy', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var body, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, hubInstance.acceptPayment(req.body)];
                        case 1:
                            body = _a.sent();
                            res.status(200).send(body);
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _a.sent();
                            res.sendStatus(400);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
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
        it('should reject payments with a settlement period lower than the minimum', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, expects_rejection_1.default(clientInstance.buy({
                        receiver: receiver,
                        price: price,
                        gateway: "http://localhost:" + hubPort + "/machinomy",
                        meta: ''
                    }))];
            });
        }); });
        it('should accept payments with a settlement period higher than the minimum', function () {
            clientInstance = new index_1.default(sender, web3, {
                settlementPeriod: 11,
                databaseUrl: "nedb:///tmp/machinomy-client-" + Date.now()
            });
            return clientInstance.buy({
                receiver: receiver,
                price: price,
                gateway: "http://localhost:" + hubPort + "/machinomy",
                meta: ''
            }).then(function (res) {
                expect(res.token.length).toBeGreaterThan(0);
            });
        });
    });
});
function randomPort() {
    return 3000 + Math.floor(10000 * Math.random());
}
//# sourceMappingURL=payment_validation_flow.test.js.map