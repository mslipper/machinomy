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
var namespaced_1 = require("../util/namespaced");
var pify_1 = require("../util/pify");
var AbstractTokensDatabase = /** @class */ (function () {
    function AbstractTokensDatabase(engine, namespace) {
        this.kind = namespaced_1.namespaced(namespace, 'token');
        this.engine = engine;
    }
    return AbstractTokensDatabase;
}());
exports.AbstractTokensDatabase = AbstractTokensDatabase;
/**
 * Database layer for tokens.
 */
var MongoTokensDatabase = /** @class */ (function (_super) {
    __extends(MongoTokensDatabase, _super);
    function MongoTokensDatabase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MongoTokensDatabase.prototype.save = function (token, channelId) {
        var _this = this;
        return this.engine.exec(function (client) {
            var tokenDocument = {
                kind: _this.kind,
                token: token.toString(),
                channelId: channelId.toString()
            };
            return pify_1.default(function (cb) { return client.collection('token').insert(tokenDocument, cb); });
        });
    };
    MongoTokensDatabase.prototype.isPresent = function (token) {
        var _this = this;
        return this.engine.exec(function (client) {
            var query = { kind: _this.kind, token: token };
            return pify_1.default(function (cb) { return client.collection('token').count(query, { limit: 1 }, cb); });
        }).then(function (res) { return (res > 0); });
    };
    return MongoTokensDatabase;
}(AbstractTokensDatabase));
exports.MongoTokensDatabase = MongoTokensDatabase;
var NedbTokensDatabase = /** @class */ (function (_super) {
    __extends(NedbTokensDatabase, _super);
    function NedbTokensDatabase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NedbTokensDatabase.prototype.save = function (token, channelId) {
        var _this = this;
        return this.engine.exec(function (client) {
            var tokenDocument = {
                kind: _this.kind,
                token: token.toString(),
                channelId: channelId.toString()
            };
            return pify_1.default(function (cb) { return client.insert(tokenDocument, cb); });
        });
    };
    NedbTokensDatabase.prototype.isPresent = function (token) {
        var _this = this;
        return this.engine.exec(function (client) {
            var query = { kind: _this.kind, token: token };
            return pify_1.default(function (cb) { return client.count(query, cb); });
        }).then(function (res) { return (res > 0); });
    };
    return NedbTokensDatabase;
}(AbstractTokensDatabase));
exports.NedbTokensDatabase = NedbTokensDatabase;
var PostgresTokensDatabase = /** @class */ (function (_super) {
    __extends(PostgresTokensDatabase, _super);
    function PostgresTokensDatabase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PostgresTokensDatabase.prototype.save = function (token, channelId) {
        var _this = this;
        return this.engine.exec(function (client) { return client.query('INSERT INTO token(token, "channelId", kind) VALUES ($1, $2, $3)', [
            token,
            channelId.toString(),
            _this.kind
        ]); });
    };
    PostgresTokensDatabase.prototype.isPresent = function (token) {
        return this.engine.exec(function (client) { return client.query('SELECT COUNT(*) as count FROM token WHERE token=$1', [
            token
        ]); }).then(function (res) { return (res.rows[0].count > 0); });
    };
    return PostgresTokensDatabase;
}(AbstractTokensDatabase));
exports.PostgresTokensDatabase = PostgresTokensDatabase;
//# sourceMappingURL=tokens_database.js.map