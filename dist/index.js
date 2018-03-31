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
var payment_1 = require("./lib/payment");
var container_1 = require("./lib/container");
var client_1 = require("./lib/client");
var services_1 = require("./lib/services");
/**
 * Machinomy is a library for micropayments in Ether (and ERC20 tokens) over HTTP.
 * Machinomy provides API to send and receive a minuscule amount of money instantly.
 * Core method is [buy]{@link Machinomy.buy}. The method does all the heavy lifting providing an easy interface
 * for micropayments.
 *
 * NB. All monetary values below are denominated in Wei, including: [buy]{@link Machinomy.buy} and
 * [deposit]{@link Machinomy.deposit} methods.
 *
 * You can find ES5 example in this {@link https://github.com/machinomy/machinomy/tree/master/examples folder} of the project.
 * @example <caption>Buying with Machinomy (TypeScript)</caption>
 * <pre><code>import Machinomy from 'machinomy'
 * import Web3 = require('web3')
 *
 * const sender = '0x5bf66080c92b81173f470e25f9a12fc146278429'
 * const provider = new Web3.providers.HttpProvider("http://localhost:8545")
 * let web3 = new Web3(provider)
 *
 * let machinomy = new Machinomy(sender, web3, { engine: 'nedb' })
 *
 * const price = Number(web3.toWei(1, 'ether'))
 * const receiver = '0xebeab176c2ca2ae72f11abb1cecad5df6ccb8dfe'
 * const result = await machinomy.buy({
 *   receiver: receiver,
 *   price: price,
 *   gateway: 'http://localhost:3001/machinomy'
 *  })
 * let channelId = result.channelId
 * await machinomy.close(channelId)
 * // wait till the receiver claims the money during settling period
 * await machinomy.close(channelId) // and get the change if he/she does not
 * </code></pre>
 */
var Machinomy = /** @class */ (function () {
    /**
     * Create an instance of Machinomy.
     *
     * @example <caption>Instantiating Machinomy.</caption>
     * <pre><code>const sender = '0x5bf66080c92b81173f470e25f9a12fc146278429'
     * const provider = new Web3.providers.HttpProvider("http://localhost:8545")
     * let web3 = new Web3(provider)
     *
     * let machinomy = new Machinomy(sender, web3, { engine: 'nedb' })</code></pre>
     *
     * @param account - Ethereum account address that sends the money. Make sure it is managed by Web3 instance passed as `web3` param.
     * @param web3 - Prebuilt web3 instance that manages the account and signs payments.
     * @param options - Options object
     */
    function Machinomy(account, web3, options) {
        var serviceRegistry = services_1.default();
        serviceRegistry.bind('Web3', function () { return web3; });
        serviceRegistry.bind('MachinomyOptions', function () { return options; });
        serviceRegistry.bind('account', function () { return account; });
        serviceRegistry.bind('namespace', function () { return 'shared'; });
        this.serviceContainer = new container_1.Container(serviceRegistry);
        this.channelManager = this.serviceContainer.resolve('ChannelManager');
        this.paymentsDao = this.serviceContainer.resolve('PaymentsDatabase');
        this.client = this.serviceContainer.resolve('Client');
        this.account = account;
        this.engine = this.serviceContainer.resolve('Engine');
    }
    /**
     * Entrypoint for a purchasing.
     *
     * Wnen you `buy` for the first time from the same receiver, the method opens a channel with a deposit equal to `price`✕10.
     * Next method call forms a payment and sends it via http to `gateway` url.
     *
     * The method then returns a token and channel id, in form of {@link BuyResult}.
     *
     * @example
     * <pre><code>machinomy.buy({
     *   receiver: receiver,
     *   price: 100,
     *   gateway: 'http://localhost:3001/machinomy'
     *  })
     * </code></pre>
     */
    Machinomy.prototype.buy = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var payment, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!options.gateway) {
                            throw new Error('gateway must be specified.');
                        }
                        return [4 /*yield*/, this.nextPayment(options)];
                    case 1:
                        payment = _a.sent();
                        return [4 /*yield*/, this.client.doPayment(payment, options.gateway)];
                    case 2:
                        res = _a.sent();
                        return [2 /*return*/, { token: res.token, channelId: payment.channelId }];
                }
            });
        });
    };
    Machinomy.prototype.payment = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var payment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.nextPayment(options)];
                    case 1:
                        payment = _a.sent();
                        return [2 /*return*/, { payment: payment_1.PaymentSerde.instance.serialize(payment) }];
                }
            });
        });
    };
    Machinomy.prototype.pry = function (uri) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.client.doPreflight(uri)];
            });
        });
    };
    Machinomy.prototype.buyUrl = function (uri) {
        var _this = this;
        return this.client.doPreflight(uri).then(function (req) { return _this.buy({
            receiver: req.receiver,
            price: req.price,
            gateway: req.gateway,
            meta: req.meta,
            contractAddress: req.contractAddress
        }); });
    };
    /**
     * Put more money into the channel.
     *
     * @example
     * <pre><code>
     * let channelId = '0x0bf080aeb3ed7ea6f9174d804bd242f0b31ff1ea24800344abb580cd87f61ca7'
     * machinomy.deposit(channelId, web3.toWei(1, "ether").toNumber(())) // Put 1 Ether more
     * </code></pre>
     *
     * @param channelId - Channel id.
     * @param value - Size of deposit in Wei.
     */
    Machinomy.prototype.deposit = function (channelId, value) {
        return __awaiter(this, void 0, void 0, function () {
            var _value;
            return __generator(this, function (_a) {
                _value = new BigNumber.BigNumber(value);
                return [2 /*return*/, this.channelManager.deposit(channelId, _value)];
            });
        });
    };
    Machinomy.prototype.open = function (receiver, value, channelId) {
        return __awaiter(this, void 0, void 0, function () {
            var _value;
            return __generator(this, function (_a) {
                _value = new BigNumber.BigNumber(value);
                return [2 /*return*/, this.channelManager.openChannel(this.account, receiver, new BigNumber.BigNumber(0), _value, channelId)];
            });
        });
    };
    /**
     * Returns the list of opened channels.
     */
    Machinomy.prototype.channels = function () {
        return this.channelManager.openChannels();
    };
    Machinomy.prototype.openChannels = function () {
        return this.channels();
    };
    Machinomy.prototype.settlingChannels = function () {
        return this.channelManager.settlingChannels();
    };
    Machinomy.prototype.channelById = function (channelId) {
        return this.channelManager.channelById(channelId);
    };
    /**
     * Share the money between sender and reciver according to payments made.
     *
     * For example a channel was opened with 10 Ether. Sender makes 6 purchases, 1 Ether each.
     * Total value transferred is 6 Ether.
     * If a party closes the channel, the money deposited to the channel are split.
     * The receiver gets 6 Ether. 4 unspent Ethers return to the sender.
     *
     * A channel can be closed in two ways, according to what party initiates that.
     * The method nicely abstracts over that, so you do not need to know what is really going on under the hood.
     * For more details on how payment channels work refer to a website.
     */
    Machinomy.prototype.close = function (channelId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.channelManager.closeChannel(channelId)];
            });
        });
    };
    /**
     * Save payment into the storage and return an id of the payment. The id can be used by {@link Machinomy.paymentById}.
     */
    Machinomy.prototype.acceptPayment = function (req) {
        return this.client.acceptPayment(client_1.AcceptPaymentRequestSerde.instance.deserialize(req));
    };
    /**
     * Return information about the payment by id.
     */
    Machinomy.prototype.paymentById = function (id) {
        return this.paymentsDao.findByToken(id);
    };
    Machinomy.prototype.acceptToken = function (req) {
        return this.client.acceptVerify(req);
    };
    Machinomy.prototype.shutdown = function () {
        return this.engine.close();
    };
    Machinomy.prototype.nextPayment = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var price, channel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        price = new BigNumber.BigNumber(options.price);
                        return [4 /*yield*/, this.channelManager.requireOpenChannel(this.account, options.receiver, price)];
                    case 1:
                        channel = _a.sent();
                        return [2 /*return*/, this.channelManager.nextPayment(channel.channelId, price, options.meta || '')];
                }
            });
        });
    };
    return Machinomy;
}());
exports.default = Machinomy;
//# sourceMappingURL=index.js.map