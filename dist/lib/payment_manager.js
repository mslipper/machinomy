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
Object.defineProperty(exports, "__esModule", { value: true });
var BigNumber = require("bignumber.js");
var payment_1 = require("./payment");
var channel_manager_1 = require("./channel_manager");
var PaymentManager = /** @class */ (function () {
    function PaymentManager(chainManager, channelContract, options) {
        this.chainManager = chainManager;
        this.channelContract = channelContract;
        this.options = options;
    }
    PaymentManager.prototype.buildPaymentForChannel = function (channel, price, totalValue, meta) {
        return __awaiter(this, void 0, void 0, function () {
            var digest, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.channelContract.paymentDigest(channel.channelId, totalValue)];
                    case 1:
                        digest = _a.sent();
                        return [4 /*yield*/, this.chainManager.sign(channel.sender, digest)];
                    case 2:
                        signature = _a.sent();
                        return [2 /*return*/, new payment_1.default({
                                channelId: channel.channelId,
                                sender: channel.sender,
                                receiver: channel.receiver,
                                price: price,
                                value: totalValue,
                                channelValue: channel.value,
                                signature: signature,
                                meta: meta,
                                contractAddress: channel.contractAddress,
                                token: undefined
                            })];
                }
            });
        });
    };
    PaymentManager.prototype.isValid = function (payment, paymentChannel) {
        return __awaiter(this, void 0, void 0, function () {
            var settlementPeriod, validIncrement, validChannelValue, validChannelId, validPaymentValue, validSender, isPositive, canClaim, isAboveMinSettlementPeriod;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.channelContract.getSettlementPeriod(payment.channelId)];
                    case 1:
                        settlementPeriod = _a.sent();
                        validIncrement = (paymentChannel.spent.plus(payment.price)).lessThanOrEqualTo(paymentChannel.value);
                        validChannelValue = paymentChannel.value.equals(payment.channelValue);
                        validChannelId = paymentChannel.channelId === payment.channelId;
                        validPaymentValue = paymentChannel.value.lessThanOrEqualTo(payment.channelValue);
                        validSender = paymentChannel.sender === payment.sender;
                        isPositive = payment.value.greaterThanOrEqualTo(new BigNumber.BigNumber(0)) && payment.price.greaterThanOrEqualTo(new BigNumber.BigNumber(0));
                        return [4 /*yield*/, this.channelContract.canClaim(payment.channelId, payment.value, payment.receiver, payment.signature)];
                    case 2:
                        canClaim = _a.sent();
                        isAboveMinSettlementPeriod = new BigNumber.BigNumber(this.options.minimumSettlementPeriod || channel_manager_1.DEFAULT_SETTLEMENT_PERIOD)
                            .lessThanOrEqualTo(settlementPeriod);
                        return [2 /*return*/, validIncrement &&
                                validChannelValue &&
                                validPaymentValue &&
                                validSender &&
                                validChannelId &&
                                canClaim &&
                                isPositive &&
                                isAboveMinSettlementPeriod];
                }
            });
        });
    };
    return PaymentManager;
}());
exports.default = PaymentManager;
//# sourceMappingURL=payment_manager.js.map