"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let MongoClient;
try {
    MongoClient = require('mongodb').MongoClient;
}
catch (e) {
    MongoClient = {};
}
let PGClient;
try {
    PGClient = require('pg').Client;
}
catch (e) {
    PGClient = {};
}
let DS;
try {
    DS = require('nedb');
}
catch (e) {
    DS = {};
}
const pify_1 = require("../util/pify");
class EngineMongo {
    constructor(url) {
        this.url = url;
    }
    connect() {
        if (this.connectionInProgress) {
            return this.connectionInProgress;
        }
        this.connectionInProgress = new Promise((resolve, reject) => {
            MongoClient.connect(this.url, (err, db) => {
                if (err) {
                    return reject(err);
                }
                this._client = db;
                resolve();
            });
        });
        return this.connectionInProgress;
    }
    isConnected() {
        return Boolean(this._client);
    }
    close() {
        if (!this._client) {
            return Promise.resolve();
        }
        return this._client.close()
            .then(() => (this._client = null));
    }
    drop() {
        return this.ensureConnection().then(() => {
            return new Promise((resolve, reject) => {
                this._client.dropDatabase((err) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            });
        });
    }
    exec(cb) {
        return this.ensureConnection()
            .then(() => cb(this._client));
    }
    ensureConnection() {
        if (this._client) {
            return Promise.resolve();
        }
        return this.connect();
    }
}
exports.EngineMongo = EngineMongo;
let db = {};
class EngineNedb {
    constructor(path, inMemoryOnly = false) {
        if (db[path]) {
            this.datastore = db[path];
        }
        else {
            db[path] = new DS({ filename: path, autoload: true, inMemoryOnly: inMemoryOnly });
            this.datastore = db[path];
        }
    }
    isConnected() {
        return true;
    }
    connect() {
        return Promise.resolve();
    }
    close() {
        return Promise.resolve();
    }
    drop() {
        return this.exec((client) => pify_1.default((cb) => client.remove({}, { multi: true }, cb)));
    }
    exec(cb) {
        return Promise.resolve(this.datastore)
            .then((ds) => cb(ds));
    }
}
exports.EngineNedb = EngineNedb;
class EnginePostgres {
    constructor(url) {
        this.url = url;
    }
    connect() {
        if (this.connectionInProgress) {
            return this.connectionInProgress;
        }
        const client = new PGClient(this.url ? {
            connectionString: this.url
        } : undefined);
        this.connectionInProgress = client.connect().then(() => {
            this._client = client;
        });
        return this.connectionInProgress;
    }
    isConnected() {
        return Boolean(this._client);
    }
    close() {
        if (!this._client) {
            return Promise.resolve();
        }
        return this._client.end()
            .then(() => (this._client = null));
    }
    drop() {
        return this.exec((client) => {
            return Promise.all([
                client.query('TRUNCATE channel CASCADE'),
                client.query('TRUNCATE payment CASCADE'),
                client.query('TRUNCATE token CASCADE')
            ]);
        });
    }
    exec(cb) {
        return this.ensureConnection()
            .then(() => cb(this._client));
    }
    ensureConnection() {
        if (this._client) {
            return Promise.resolve();
        }
        return this.connect();
    }
}
exports.EnginePostgres = EnginePostgres;
//# sourceMappingURL=engine.js.map