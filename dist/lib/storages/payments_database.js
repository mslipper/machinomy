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
Object.defineProperty(exports, "__esModule", { value: true });
var payment_1 = require("../payment");
var pify_1 = require("../util/pify");
var namespaced_1 = require("../util/namespaced");
var AbstractPaymentsDatabase = /** @class */ (function () {
    function AbstractPaymentsDatabase(engine, namespace) {
        this.kind = namespaced_1.namespaced(namespace, 'payment');
        this.engine = engine;
    }
    AbstractPaymentsDatabase.prototype.inflatePayment = function (json) {
        if (!json) {
            return null;
        }
        return payment_1.PaymentSerde.instance.deserialize(json);
    };
    return AbstractPaymentsDatabase;
}());
exports.AbstractPaymentsDatabase = AbstractPaymentsDatabase;
/**
 * Database layer for payments.
 */
var MongoPaymentsDatabase = /** @class */ (function (_super) {
    __extends(MongoPaymentsDatabase, _super);
    function MongoPaymentsDatabase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Save payment to the database, to check later.
     */
    MongoPaymentsDatabase.prototype.save = function (token, payment) {
        var serialized = payment_1.PaymentSerde.instance.serialize(payment);
        serialized.kind = this.kind;
        serialized.token = token;
        serialized.createdAt = Date.now();
        // log.info(`Saving payment for channel ${payment.channelId} and token ${token}`)
        return this.engine.exec(function (client) { return pify_1.default(function (cb) { return client.collection('payment').insert(serialized, cb); }); });
    };
    /**
     * Find a payment with maximum value on it inside the channel.
     */
    MongoPaymentsDatabase.prototype.firstMaximum = function (channelId) {
        var _this = this;
        // log.info(`Trying to find last payment for channel ${channelId.toString()}`)
        var query = { kind: this.kind, channelId: channelId.toString() };
        return this.engine.exec(function (client) { return pify_1.default(function (cb) { return client.collection('payment')
            .find(query).sort({ value: -1 }).limit(1).toArray(cb); }); })
            .then(function (res) { return _this.inflatePayment(res[0]); });
    };
    /**
     * Find a payment by token.
     */
    MongoPaymentsDatabase.prototype.findByToken = function (token) {
        var _this = this;
        var query = { kind: this.kind, token: token };
        return this.engine.exec(function (client) { return pify_1.default(function (cb) { return client.collection('payment').findOne(query, cb); }); })
            .then(function (res) { return _this.inflatePayment(res); });
    };
    return MongoPaymentsDatabase;
}(AbstractPaymentsDatabase));
exports.MongoPaymentsDatabase = MongoPaymentsDatabase;
var NedbPaymentsDatabase = /** @class */ (function (_super) {
    __extends(NedbPaymentsDatabase, _super);
    function NedbPaymentsDatabase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NedbPaymentsDatabase.prototype.save = function (token, payment) {
        var serialized = payment_1.PaymentSerde.instance.serialize(payment);
        serialized.kind = this.kind;
        serialized.token = token;
        serialized.createdAt = Date.now();
        // log.info(`Saving payment for channel ${payment.channelId} and token ${token}`)
        return this.engine.exec(function (client) { return pify_1.default(function (cb) { return client.insert(serialized, cb); }); });
    };
    /**
     * Find a payment with maximum value on it inside the channel.
     */
    NedbPaymentsDatabase.prototype.firstMaximum = function (channelId) {
        var _this = this;
        // log.info(`Trying to find last payment for channel ${channelId.toString()}`)
        var query = { kind: this.kind, channelId: channelId.toString() };
        return this.engine.exec(function (client) { return pify_1.default(function (cb) { return client.findOne(query).sort({ value: -1 }).exec(cb); }); })
            .then(function (res) { return _this.inflatePayment(res); });
    };
    /**
     * Find a payment by token.
     */
    NedbPaymentsDatabase.prototype.findByToken = function (token) {
        var _this = this;
        var query = { kind: this.kind, token: token };
        return this.engine.exec(function (client) { return pify_1.default(function (cb) { return client.findOne(query, cb); }); })
            .then(function (res) { return _this.inflatePayment(res); });
    };
    return NedbPaymentsDatabase;
}(AbstractPaymentsDatabase));
exports.NedbPaymentsDatabase = NedbPaymentsDatabase;
var PostgresPaymentsDatabase = /** @class */ (function (_super) {
    __extends(PostgresPaymentsDatabase, _super);
    function PostgresPaymentsDatabase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PostgresPaymentsDatabase.prototype.save = function (token, payment) {
        var serialized = payment_1.PaymentSerde.instance.serialize(payment);
        serialized.kind = this.kind;
        serialized.token = token;
        return this.engine.exec(function (client) { return client.query('INSERT INTO payment("channelId", kind, token, sender, receiver, price, value, ' +
            '"channelValue", v, r, s, meta, "contractAddress", "createdAt") VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)', [
            serialized.channelId,
            serialized.kind,
            serialized.token,
            serialized.sender,
            serialized.receiver,
            serialized.price,
            serialized.value,
            serialized.channelValue,
            serialized.v,
            serialized.r,
            serialized.s,
            serialized.meta,
            serialized.contractAddress,
            Date.now()
        ]); });
    };
    PostgresPaymentsDatabase.prototype.firstMaximum = function (channelId) {
        var _this = this;
        return this.engine.exec(function (client) { return client.query('SELECT "channelId", kind, token, sender, receiver, price, value, ' +
            '"channelValue", v, r, s, meta, "contractAddress", "createdAt" FROM payment WHERE "channelId" = $1 ' +
            'ORDER BY value DESC', [
            channelId.toString()
        ]); }).then(function (res) { return _this.inflatePayment(res.rows[0]); });
    };
    PostgresPaymentsDatabase.prototype.findByToken = function (token) {
        var _this = this;
        return this.engine.exec(function (client) { return client.query('SELECT "channelId", kind, token, sender, receiver, price, value, ' +
            '"channelValue", v, r, s, meta, "contractAddress", "createdAt" FROM payment WHERE token = $1', [
            token
        ]); }).then(function (res) { return _this.inflatePayment(res.rows[0]); });
    };
    return PostgresPaymentsDatabase;
}(AbstractPaymentsDatabase));
exports.PostgresPaymentsDatabase = PostgresPaymentsDatabase;
//# sourceMappingURL=payments_database.js.map