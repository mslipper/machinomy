"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var events_1 = require("events");
var transport_1 = require("./transport");
var payment_1 = require("./payment");
var log_1 = require("./util/log");
var fetch_1 = require("./util/fetch");
var LOG = log_1.default('Client');
var AcceptPaymentRequest = /** @class */ (function () {
    function AcceptPaymentRequest(payment) {
        this.payment = payment;
    }
    return AcceptPaymentRequest;
}());
exports.AcceptPaymentRequest = AcceptPaymentRequest;
var AcceptPaymentRequestSerde = /** @class */ (function () {
    function AcceptPaymentRequestSerde() {
    }
    AcceptPaymentRequestSerde.prototype.serialize = function (obj) {
        return {
            payment: payment_1.PaymentSerde.instance.serialize(obj.payment)
        };
    };
    AcceptPaymentRequestSerde.prototype.deserialize = function (data) {
        if (!data.payment) {
            throw new Error('Cannot deserialize payment request. Payment is missing.');
        }
        var payment = payment_1.PaymentSerde.instance.deserialize(data.payment);
        return new AcceptPaymentRequest(payment);
    };
    AcceptPaymentRequestSerde.instance = new AcceptPaymentRequestSerde();
    return AcceptPaymentRequestSerde;
}());
exports.AcceptPaymentRequestSerde = AcceptPaymentRequestSerde;
var AcceptPaymentResponse = /** @class */ (function () {
    function AcceptPaymentResponse(token) {
        this.token = token;
    }
    return AcceptPaymentResponse;
}());
exports.AcceptPaymentResponse = AcceptPaymentResponse;
var AcceptPaymentResponseSerde = /** @class */ (function () {
    function AcceptPaymentResponseSerde() {
    }
    AcceptPaymentResponseSerde.prototype.serialize = function (obj) {
        return {
            token: obj.token
        };
    };
    AcceptPaymentResponseSerde.prototype.deserialize = function (data) {
        if (!data.token) {
            throw new Error('Cannot deserialize payment response. Token is missing.');
        }
        return new AcceptPaymentResponse(data.token);
    };
    AcceptPaymentResponseSerde.instance = new AcceptPaymentResponseSerde();
    return AcceptPaymentResponseSerde;
}());
exports.AcceptPaymentResponseSerde = AcceptPaymentResponseSerde;
var AcceptTokenRequest = /** @class */ (function () {
    function AcceptTokenRequest(token) {
        this.token = token;
    }
    return AcceptTokenRequest;
}());
exports.AcceptTokenRequest = AcceptTokenRequest;
var AcceptTokenRequestSerde = /** @class */ (function () {
    function AcceptTokenRequestSerde() {
    }
    AcceptTokenRequestSerde.prototype.serialize = function (obj) {
        return {
            token: obj.token
        };
    };
    AcceptTokenRequestSerde.prototype.deserialize = function (data) {
        if (!data.token) {
            throw new Error('Cannot deserialize token request. Token is missing.');
        }
        return new AcceptTokenRequest(data.token);
    };
    AcceptTokenRequestSerde.instance = new AcceptTokenRequestSerde();
    return AcceptTokenRequestSerde;
}());
exports.AcceptTokenRequestSerde = AcceptTokenRequestSerde;
var AcceptTokenResponse = /** @class */ (function () {
    function AcceptTokenResponse(status) {
        this.status = status;
    }
    return AcceptTokenResponse;
}());
exports.AcceptTokenResponse = AcceptTokenResponse;
var AcceptTokenResponseSerde = /** @class */ (function () {
    function AcceptTokenResponseSerde() {
    }
    AcceptTokenResponseSerde.prototype.serialize = function (obj) {
        return {
            status: obj.status
        };
    };
    AcceptTokenResponseSerde.prototype.deserialize = function (data) {
        if (data.status === undefined) {
            throw new Error('Cannot deserialize token response. Status is missing.');
        }
        return new AcceptTokenResponse(data.status);
    };
    AcceptTokenResponseSerde.instance = new AcceptTokenResponseSerde();
    return AcceptTokenResponseSerde;
}());
exports.AcceptTokenResponseSerde = AcceptTokenResponseSerde;
var ClientImpl = /** @class */ (function (_super) {
    __extends(ClientImpl, _super);
    function ClientImpl(transport, channelManager) {
        var _this = _super.call(this) || this;
        _this.transport = transport;
        _this.channelManager = channelManager;
        return _this;
    }
    ClientImpl.prototype.doPreflight = function (uri) {
        var _this = this;
        this.emit('willPreflight');
        return this.transport.get(uri).then(function (res) {
            _this.emit('didPreflight');
            switch (res.statusCode) {
                case transport_1.STATUS_CODES.PAYMENT_REQUIRED:
                case transport_1.STATUS_CODES.OK:
                    return _this.handlePaymentRequired(res);
                default:
                    throw new Error('Received bad response from content server.');
            }
        });
    };
    ClientImpl.prototype.doPayment = function (payment, gateway) {
        return __awaiter(this, void 0, void 0, function () {
            var request, res, resJson, deres;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.emit('willSendPayment');
                        LOG("Attempting to send payment to " + gateway + ". Sender: " + payment.sender + " / Receiver: " + payment.receiver + " / Amount: " + payment.price.toString());
                        request = new AcceptPaymentRequest(payment);
                        return [4 /*yield*/, fetch_1.default.fetch(gateway, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'include',
                                body: JSON.stringify(AcceptPaymentRequestSerde.instance.serialize(request))
                            })];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        resJson = _a.sent();
                        deres = AcceptPaymentResponseSerde.instance.deserialize(resJson);
                        LOG("Successfully sent payment to " + gateway + ".");
                        this.emit('didSendPayment');
                        return [2 /*return*/, deres];
                }
            });
        });
    };
    ClientImpl.prototype.acceptPayment = function (req) {
        var payment = req.payment;
        LOG("Received payment request. Sender: " + payment.sender + " / Receiver: " + payment.receiver);
        return this.channelManager.acceptPayment(payment)
            .then(function (token) {
            LOG("Accepted payment request. Sender: " + payment.sender + " / Receiver: " + payment.receiver);
            return new AcceptPaymentResponse(token);
        });
    };
    ClientImpl.prototype.doVerify = function (token, gateway) {
        return __awaiter(this, void 0, void 0, function () {
            var request, res, resJson, deres, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.emit('willVerifyToken');
                        LOG("Attempting to verify token with " + gateway + ".");
                        request = new AcceptTokenRequest(token);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch_1.default.fetch(gateway, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'include',
                                body: JSON.stringify(AcceptTokenRequestSerde.instance.serialize(request))
                            })];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        resJson = _a.sent();
                        deres = AcceptTokenResponseSerde.instance.deserialize(resJson);
                        LOG("Successfully verified token with " + gateway + ".");
                        this.emit('didVerifyToken');
                        return [2 /*return*/, deres];
                    case 4:
                        e_1 = _a.sent();
                        return [2 /*return*/, new AcceptTokenResponse(false)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ClientImpl.prototype.acceptVerify = function (req) {
        return this.channelManager.verifyToken(req.token)
            .then(function (res) { return new AcceptTokenResponse(res); })
            .catch(function () { return new AcceptTokenResponse(false); });
    };
    ClientImpl.prototype.handlePaymentRequired = function (res) {
        var headers = res.headers;
        ClientImpl.REQUIRED_HEADERS.forEach(function (name) {
            var header = ClientImpl.HEADER_PREFIX + "-" + name;
            if (!headers[header]) {
                throw new Error("Missing required header: " + header);
            }
        });
        return transport_1.PaymentRequired.parse(headers);
    };
    ClientImpl.HEADER_PREFIX = 'paywall';
    ClientImpl.REQUIRED_HEADERS = [
        'version',
        'address',
        'price',
        'gateway'
    ];
    return ClientImpl;
}(events_1.EventEmitter));
exports.ClientImpl = ClientImpl;
//# sourceMappingURL=client.js.map