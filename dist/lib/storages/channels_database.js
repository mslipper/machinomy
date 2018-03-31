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
var channel_1 = require("../channel");
var namespaced_1 = require("../util/namespaced");
var pify_1 = require("../util/pify");
var log_1 = require("../util/log");
var LOG = log_1.default('AbstractChannelsDatabase');
var AbstractChannelsDatabase = /** @class */ (function () {
    function AbstractChannelsDatabase(engine, channelContract, namespace) {
        this.kind = namespaced_1.namespaced(namespace, 'channel');
        this.engine = engine;
        this.contract = channelContract;
    }
    AbstractChannelsDatabase.prototype.inflatePaymentChannels = function (channels) {
        var _this = this;
        if (!channels.length) {
            return Promise.resolve([]);
        }
        // There shouldn't be any nulls here.
        return Promise.all(channels.map(function (chan) { return _this.inflatePaymentChannel(chan); }));
    };
    AbstractChannelsDatabase.prototype.inflatePaymentChannel = function (json) {
        return __awaiter(this, void 0, void 0, function () {
            var state, value, doc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!json) {
                            return [2 /*return*/, Promise.resolve(null)];
                        }
                        return [4 /*yield*/, this.contract.getState(json.channelId)];
                    case 1:
                        state = _a.sent();
                        return [4 /*yield*/, this.contract.channelById(json.channelId)];
                    case 2:
                        value = (_a.sent())[2];
                        doc = channel_1.PaymentChannel.fromDocument(json);
                        return [2 /*return*/, new channel_1.PaymentChannel(doc.sender, doc.receiver, doc.channelId, value, doc.spent, state === -1 ? 2 : state, doc.contractAddress || undefined)];
                }
            });
        });
    };
    AbstractChannelsDatabase.prototype.filterByState = function (state, channels) {
        return channels.filter(function (chan) { return chan.state === state; });
    };
    AbstractChannelsDatabase.prototype.saveOrUpdate = function (paymentChannel) {
        var _this = this;
        LOG("Saving or updating channel with ID " + paymentChannel.channelId.toString());
        return this.firstById(paymentChannel.channelId).then(function (found) {
            if (found) {
                LOG("Spending channel with ID " + paymentChannel.channelId.toString());
                return _this.spend(paymentChannel.channelId, paymentChannel.spent);
            }
            else {
                LOG("Spending channel with ID " + paymentChannel.channelId.toString());
                return _this.save(paymentChannel);
            }
        });
    };
    AbstractChannelsDatabase.prototype.allSettling = function () {
        return __awaiter(this, void 0, void 0, function () {
            var all;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.all()];
                    case 1:
                        all = _a.sent();
                        return [2 /*return*/, this.filterByState(1, all)];
                }
            });
        });
    };
    return AbstractChannelsDatabase;
}());
exports.AbstractChannelsDatabase = AbstractChannelsDatabase;
/**
 * Database layer for {PaymentChannel}
 */
var NedbChannelsDatabase = /** @class */ (function (_super) {
    __extends(NedbChannelsDatabase, _super);
    function NedbChannelsDatabase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NedbChannelsDatabase.prototype.save = function (paymentChannel) {
        var _this = this;
        return this.engine.exec(function (client) {
            var document = {
                kind: _this.kind,
                sender: paymentChannel.sender,
                receiver: paymentChannel.receiver,
                value: paymentChannel.value.toString(),
                spent: paymentChannel.spent.toString(),
                channelId: paymentChannel.channelId,
                state: paymentChannel.state,
                contractAddress: paymentChannel.contractAddress
            };
            return pify_1.default(function (cb) { return client.insert(document, cb); });
        });
    };
    NedbChannelsDatabase.prototype.firstById = function (channelId) {
        var _this = this;
        return this.engine.exec(function (client) {
            var query = {
                kind: _this.kind,
                channelId: channelId.toString()
            };
            return pify_1.default(function (cb) { return client.find(query, cb); });
        }).then(function (doc) { return _this.inflatePaymentChannel(doc[0]); });
    };
    /**
     * Set amount of money spent on the channel.
     */
    NedbChannelsDatabase.prototype.spend = function (channelId, spent) {
        var _this = this;
        return this.engine.exec(function (client) {
            var query = {
                kind: _this.kind,
                channelId: channelId.toString()
            };
            var update = {
                $set: {
                    spent: spent.toString()
                }
            };
            return pify_1.default(function (cb) { return client.update(query, update, {}, cb); });
        });
    };
    NedbChannelsDatabase.prototype.deposit = function (channelId, value) {
        var _this = this;
        return this.engine.exec(function (client) { return __awaiter(_this, void 0, void 0, function () {
            var channel, query, newValue, update;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.firstById(channelId)];
                    case 1:
                        channel = _a.sent();
                        if (!channel) {
                            throw new Error('Channel not found.');
                        }
                        query = {
                            kind: this.kind,
                            channelId: channelId.toString()
                        };
                        newValue = channel.value.add(value);
                        update = {
                            $set: {
                                value: newValue.toString()
                            }
                        };
                        return [2 /*return*/, pify_1.default(function (cb) { return client.update(query, update, {}, cb); })];
                }
            });
        }); });
    };
    /**
     * Retrieve all the payment channels stored.
     *
     * @return {Promise<PaymentChannel>}
     */
    NedbChannelsDatabase.prototype.all = function () {
        var _this = this;
        return this.engine.exec(function (client) {
            return pify_1.default(function (cb) { return client.find({ kind: _this.kind }, cb); });
        }).then(function (res) { return _this.inflatePaymentChannels(res); });
    };
    NedbChannelsDatabase.prototype.allOpen = function () {
        var _this = this;
        return this.engine.exec(function (client) {
            return pify_1.default(function (cb) { return client.find({ kind: _this.kind, state: 0 }, cb); });
        }).then(function (res) { return _this.inflatePaymentChannels(res); })
            .then(function (chans) { return _this.filterByState(0, chans); });
    };
    NedbChannelsDatabase.prototype.findUsable = function (sender, receiver, amount) {
        var _this = this;
        return this.engine.exec(function (client) {
            var query = {
                kind: _this.kind,
                state: 0,
                sender: sender,
                receiver: receiver
            };
            return pify_1.default(function (cb) { return client.find(query, cb); });
        }).then(function (res) { return _this.inflatePaymentChannels(res); })
            .then(function (channels) { return _this.filterByState(0, channels); })
            .then(function (res) {
            return res.find(function (chan) { return chan.value.greaterThanOrEqualTo(chan.spent.add(amount)); }) || null;
        });
    };
    NedbChannelsDatabase.prototype.findBySenderReceiver = function (sender, receiver) {
        var _this = this;
        return this.engine.exec(function (client) {
            return pify_1.default(function (cb) { return client.find({ sender: sender, receiver: receiver, kind: _this.kind }, cb); });
        }).then(function (res) { return _this.inflatePaymentChannels(res); });
    };
    NedbChannelsDatabase.prototype.findBySenderReceiverChannelId = function (sender, receiver, channelId) {
        var _this = this;
        return this.engine.exec(function (client) {
            return pify_1.default(function (cb) { return client.find({
                sender: sender,
                receiver: receiver,
                channelId: channelId.toString(),
                kind: _this.kind
            }, cb); });
        }).then(function (res) { return _this.inflatePaymentChannel(res[0]); });
    };
    NedbChannelsDatabase.prototype.updateState = function (channelId, state) {
        var _this = this;
        return this.engine.exec(function (client) {
            var query = {
                kind: _this.kind,
                channelId: channelId.toString()
            };
            var update = {
                $set: {
                    state: state
                }
            };
            return pify_1.default(function (cb) { return client.update(query, update, {}, cb); });
        });
    };
    return NedbChannelsDatabase;
}(AbstractChannelsDatabase));
exports.NedbChannelsDatabase = NedbChannelsDatabase;
var MongoChannelsDatabase = /** @class */ (function (_super) {
    __extends(MongoChannelsDatabase, _super);
    function MongoChannelsDatabase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MongoChannelsDatabase.prototype.save = function (paymentChannel) {
        var _this = this;
        return this.engine.exec(function (client) {
            var document = {
                kind: _this.kind,
                sender: paymentChannel.sender,
                receiver: paymentChannel.receiver,
                value: paymentChannel.value.toString(),
                spent: paymentChannel.spent.toString(),
                channelId: paymentChannel.channelId,
                state: paymentChannel.state,
                contractAddress: paymentChannel.contractAddress
            };
            return pify_1.default(function (cb) { return client.collection('channel').insert(document, cb); });
        });
    };
    MongoChannelsDatabase.prototype.firstById = function (channelId) {
        var _this = this;
        return this.engine.exec(function (client) {
            var query = {
                kind: _this.kind,
                channelId: channelId.toString()
            };
            return pify_1.default(function (cb) { return client.collection('channel').findOne(query, cb); });
        }).then(function (doc) {
            if (!doc) {
                return null;
            }
            return _this.inflatePaymentChannel(doc);
        });
    };
    /**
     * Set amount of money spent on the channel.
     */
    MongoChannelsDatabase.prototype.spend = function (channelId, spent) {
        var _this = this;
        return this.engine.exec(function (client) {
            var query = {
                kind: _this.kind,
                channelId: channelId.toString()
            };
            var update = {
                $set: {
                    spent: spent.toString()
                }
            };
            return pify_1.default(function (cb) { return client.collection('channel').update(query, update, {}, cb); });
        });
    };
    MongoChannelsDatabase.prototype.deposit = function (channelId, value) {
        var _this = this;
        return this.engine.exec(function (client) { return __awaiter(_this, void 0, void 0, function () {
            var channel, query, newValue, update;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.firstById(channelId)];
                    case 1:
                        channel = _a.sent();
                        if (!channel) {
                            throw new Error('Channel not found.');
                        }
                        query = {
                            kind: this.kind,
                            channelId: channelId.toString()
                        };
                        newValue = channel.value.add(value);
                        update = {
                            $set: {
                                value: newValue.toString()
                            }
                        };
                        return [2 /*return*/, pify_1.default(function (cb) { return client.collection('channel').update(query, update, {}, cb); })];
                }
            });
        }); });
    };
    /**
     * Retrieve all the payment channels stored.
     *
     * @return {Promise<PaymentChannel>}
     */
    MongoChannelsDatabase.prototype.all = function () {
        var _this = this;
        return this.engine.exec(function (client) {
            return pify_1.default(function (cb) { return client.collection('channel').find({}).toArray(cb); });
        }).then(function (res) { return _this.inflatePaymentChannels(res); });
    };
    MongoChannelsDatabase.prototype.allOpen = function () {
        var _this = this;
        return this.engine.exec(function (client) {
            return pify_1.default(function (cb) { return client.collection('channel').find({ state: 0 }).toArray(cb); });
        }).then(function (res) { return _this.inflatePaymentChannels(res); })
            .then(function (chans) { return _this.filterByState(0, chans); });
    };
    MongoChannelsDatabase.prototype.findUsable = function (sender, receiver, amount) {
        var _this = this;
        return this.engine.exec(function (client) {
            var query = {
                sender: sender,
                receiver: receiver,
                state: 0
            };
            return pify_1.default(function (cb) { return client.collection('channel').find(query).toArray(cb); });
        }).then(function (res) { return _this.inflatePaymentChannels(res); })
            .then(function (channels) { return _this.filterByState(0, channels); })
            .then(function (res) {
            return res.find(function (chan) { return chan.value.greaterThanOrEqualTo(chan.spent.add(amount)); }) || null;
        });
    };
    MongoChannelsDatabase.prototype.findBySenderReceiver = function (sender, receiver) {
        var _this = this;
        return this.engine.exec(function (client) {
            return pify_1.default(function (cb) { return client.collection('channel').find({ sender: sender, receiver: receiver }).toArray(cb); });
        }).then(function (res) { return _this.inflatePaymentChannels(res); });
    };
    MongoChannelsDatabase.prototype.findBySenderReceiverChannelId = function (sender, receiver, channelId) {
        var _this = this;
        return this.engine.exec(function (client) {
            return pify_1.default(function (cb) { return client.collection('channel').find({
                sender: sender,
                receiver: receiver,
                channelId: channelId.toString()
            }).toArray(cb); });
        }).then(function (res) { return _this.inflatePaymentChannel(res[0]); });
    };
    MongoChannelsDatabase.prototype.updateState = function (channelId, state) {
        var _this = this;
        return this.engine.exec(function (client) {
            var query = {
                kind: _this.kind,
                channelId: channelId.toString()
            };
            var update = {
                $set: {
                    state: state
                }
            };
            return pify_1.default(function (cb) { return client.collection('channel').update(query, update, {}, cb); });
        });
    };
    return MongoChannelsDatabase;
}(AbstractChannelsDatabase));
exports.MongoChannelsDatabase = MongoChannelsDatabase;
var PostgresChannelsDatabase = /** @class */ (function (_super) {
    __extends(PostgresChannelsDatabase, _super);
    function PostgresChannelsDatabase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PostgresChannelsDatabase.prototype.save = function (paymentChannel) {
        var _this = this;
        return this.engine.exec(function (client) { return client.query('INSERT INTO channel("channelId", kind, sender, receiver, value, spent, state, "contractAddress") ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
            paymentChannel.channelId,
            _this.kind,
            paymentChannel.sender,
            paymentChannel.receiver,
            paymentChannel.value.toString(),
            paymentChannel.spent.toString(),
            paymentChannel.state,
            paymentChannel.contractAddress
        ]); });
    };
    PostgresChannelsDatabase.prototype.firstById = function (channelId) {
        var _this = this;
        return this.engine.exec(function (client) { return client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel ' +
            'WHERE "channelId" = $1 LIMIT 1', [
            channelId.toString()
        ]); }).then(function (res) { return _this.inflatePaymentChannel(res.rows[0]); });
    };
    PostgresChannelsDatabase.prototype.spend = function (channelId, spent) {
        return this.engine.exec(function (client) { return client.query('UPDATE channel SET spent = $2 WHERE "channelId" = $1', [
            channelId.toString(),
            spent.toString()
        ]); });
    };
    PostgresChannelsDatabase.prototype.deposit = function (channelId, value) {
        var _this = this;
        return this.engine.exec(function (client) { return __awaiter(_this, void 0, void 0, function () {
            var channel, newValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.firstById(channelId)];
                    case 1:
                        channel = _a.sent();
                        if (!channel) {
                            throw new Error('Channel not found.');
                        }
                        newValue = channel.value.add(value);
                        return [2 /*return*/, client.query('UPDATE channel SET value = $2 WHERE "channelId" = $1', [
                                channelId.toString(),
                                newValue.toString()
                            ])];
                }
            });
        }); });
    };
    PostgresChannelsDatabase.prototype.all = function () {
        var _this = this;
        return this.engine.exec(function (client) { return client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel'); }).then(function (res) { return _this.inflatePaymentChannels(res.rows); });
    };
    PostgresChannelsDatabase.prototype.allOpen = function () {
        var _this = this;
        return this.engine.exec(function (client) { return client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel ' +
            'WHERE state = 0'); }).then(function (res) { return _this.inflatePaymentChannels(res.rows); })
            .then(function (chans) { return _this.filterByState(0, chans); });
    };
    PostgresChannelsDatabase.prototype.findUsable = function (sender, receiver, amount) {
        var _this = this;
        return this.engine.exec(function (client) { return client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel ' +
            'WHERE sender = $1 AND receiver = $2 AND value >= spent + $3 AND state = 0', [
            sender,
            receiver,
            amount.toString()
        ]); }).then(function (res) { return _this.inflatePaymentChannel(res.rows[0]); })
            .then(function (channel) { return _this.filterByState(0, [channel])[0] || null; });
    };
    PostgresChannelsDatabase.prototype.findBySenderReceiver = function (sender, receiver) {
        var _this = this;
        return this.engine.exec(function (client) { return client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel ' +
            'WHERE sender = $1 AND receiver = $2', [
            sender,
            receiver
        ]); }).then(function (res) { return _this.inflatePaymentChannels(res.rows); });
    };
    PostgresChannelsDatabase.prototype.findBySenderReceiverChannelId = function (sender, receiver, channelId) {
        var _this = this;
        return this.engine.exec(function (client) { return client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel ' +
            'WHERE sender = $1 AND receiver = $2 AND "channelId" = $3 LIMIT 1', [
            sender,
            receiver,
            channelId.toString()
        ]); }).then(function (res) { return _this.inflatePaymentChannel(res.rows[0]); });
    };
    PostgresChannelsDatabase.prototype.updateState = function (channelId, state) {
        return this.engine.exec(function (client) { return client.query('UPDATE channel SET state = $1 WHERE "channelId" = $2', [
            state,
            channelId.toString()
        ]); });
    };
    return PostgresChannelsDatabase;
}(AbstractChannelsDatabase));
exports.PostgresChannelsDatabase = PostgresChannelsDatabase;
//# sourceMappingURL=channels_database.js.map