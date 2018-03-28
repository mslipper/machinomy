"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MongoClient;
try {
    MongoClient = require('mongodb').MongoClient;
}
catch (e) {
    MongoClient = {};
}
var PGClient;
try {
    PGClient = require('pg').Client;
}
catch (e) {
    PGClient = {};
}
var DS;
try {
    DS = require('nedb');
}
catch (e) {
    DS = {};
}
var pify_1 = require("../util/pify");
var EngineMongo = /** @class */ (function () {
    function EngineMongo(url) {
        this.url = url;
    }
    EngineMongo.prototype.connect = function () {
        var _this = this;
        if (this.connectionInProgress) {
            return this.connectionInProgress;
        }
        this.connectionInProgress = new Promise(function (resolve, reject) {
            MongoClient.connect(_this.url, function (err, db) {
                if (err) {
                    return reject(err);
                }
                _this._client = db;
                resolve();
            });
        });
        return this.connectionInProgress;
    };
    EngineMongo.prototype.isConnected = function () {
        return Boolean(this._client);
    };
    EngineMongo.prototype.close = function () {
        var _this = this;
        if (!this._client) {
            return Promise.resolve();
        }
        return this._client.close()
            .then(function () { return (_this._client = null); });
    };
    EngineMongo.prototype.drop = function () {
        var _this = this;
        return this.ensureConnection().then(function () {
            return new Promise(function (resolve, reject) {
                _this._client.dropDatabase(function (err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            });
        });
    };
    EngineMongo.prototype.exec = function (cb) {
        var _this = this;
        return this.ensureConnection()
            .then(function () { return cb(_this._client); });
    };
    EngineMongo.prototype.ensureConnection = function () {
        if (this._client) {
            return Promise.resolve();
        }
        return this.connect();
    };
    return EngineMongo;
}());
exports.EngineMongo = EngineMongo;
var db = {};
var EngineNedb = /** @class */ (function () {
    function EngineNedb(path, inMemoryOnly) {
        if (inMemoryOnly === void 0) { inMemoryOnly = false; }
        if (db[path]) {
            this.datastore = db[path];
        }
        else {
            db[path] = new DS({ filename: path, autoload: true, inMemoryOnly: inMemoryOnly });
            this.datastore = db[path];
        }
    }
    EngineNedb.prototype.isConnected = function () {
        return true;
    };
    EngineNedb.prototype.connect = function () {
        return Promise.resolve();
    };
    EngineNedb.prototype.close = function () {
        return Promise.resolve();
    };
    EngineNedb.prototype.drop = function () {
        return this.exec(function (client) { return pify_1.default(function (cb) { return client.remove({}, { multi: true }, cb); }); });
    };
    EngineNedb.prototype.exec = function (cb) {
        return Promise.resolve(this.datastore)
            .then(function (ds) { return cb(ds); });
    };
    return EngineNedb;
}());
exports.EngineNedb = EngineNedb;
var EnginePostgres = /** @class */ (function () {
    function EnginePostgres(url) {
        this.url = url;
    }
    EnginePostgres.prototype.connect = function () {
        var _this = this;
        if (this.connectionInProgress) {
            return this.connectionInProgress;
        }
        var client = new PGClient(this.url ? {
            connectionString: this.url
        } : undefined);
        this.connectionInProgress = client.connect().then(function () {
            _this._client = client;
        });
        return this.connectionInProgress;
    };
    EnginePostgres.prototype.isConnected = function () {
        return Boolean(this._client);
    };
    EnginePostgres.prototype.close = function () {
        var _this = this;
        if (!this._client) {
            return Promise.resolve();
        }
        return this._client.end()
            .then(function () { return (_this._client = null); });
    };
    EnginePostgres.prototype.drop = function () {
        return this.exec(function (client) {
            return Promise.all([
                client.query('TRUNCATE channel CASCADE'),
                client.query('TRUNCATE payment CASCADE'),
                client.query('TRUNCATE token CASCADE')
            ]);
        });
    };
    EnginePostgres.prototype.exec = function (cb) {
        var _this = this;
        return this.ensureConnection()
            .then(function () { return cb(_this._client); });
    };
    EnginePostgres.prototype.ensureConnection = function () {
        if (this._client) {
            return Promise.resolve();
        }
        return this.connect();
    };
    return EnginePostgres;
}());
exports.EnginePostgres = EnginePostgres;
//# sourceMappingURL=engine.js.map