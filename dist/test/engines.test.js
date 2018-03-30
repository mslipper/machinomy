"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Datastore = require("nedb");
var sinon = require("sinon");
var support_1 = require("./support");
var engine_1 = require("../lib/engines/engine");
var expect = require('expect');
var MongoClient = require('mongodb').MongoClient;
var PGClient = require('pg').Client;
describe('EngineMongo', function () {
    var engine;
    beforeEach(function () {
        engine = new engine_1.EngineMongo('mongodb://localhost:27017/machinomy');
    });
    describe('isConnected', function () {
        it('defaults to false', function () {
            expect(engine.isConnected()).toBe(false);
        });
    });
    describe('.connect', function () {
        it('connects to the database', function () {
            var stub = sinon.stub(MongoClient, 'connect')
                .callsFake(function (conn, cb) { return setImmediate(cb(null, 'fake client')); });
            return engine.connect()
                .then(function () {
                expect(stub.callCount).toBe(1);
                stub.restore();
            });
        });
        it('prevents multiple concurrent connections', function () {
            var stub = sinon.stub(MongoClient, 'connect')
                .callsFake(function (conn, cb) { return setImmediate(cb(null, 'fake client')); });
            return Promise.all([
                engine.connect(),
                engine.connect(),
                engine.connect()
            ]).then(function () {
                expect(stub.callCount).toBe(1);
                stub.restore();
            });
        });
        it('marks isConnected as true', function () {
            var stub = sinon.stub(MongoClient, 'connect')
                .callsFake(function (conn, cb) { return setImmediate(cb(null, 'fake client')); });
            return engine.connect()
                .then(function () {
                expect(engine.isConnected()).toBe(true);
                stub.restore();
            });
        });
    });
    describe('close', function () {
        it('closes the connection', function () {
            var close = sinon.stub().resolves();
            var stub = sinon.stub(MongoClient, 'connect')
                .callsFake(function (conn, cb) { return setImmediate(cb(null, { close: close })); });
            return engine.connect()
                .then(function () { return engine.close(); })
                .then(function () {
                expect(close.callCount).toBe(1);
                stub.restore();
            });
        });
        it('marks isConnected as false', function () {
            var close = sinon.stub().resolves();
            var stub = sinon.stub(MongoClient, 'connect')
                .callsFake(function (conn, cb) { return setImmediate(cb(null, { close: close })); });
            return engine.connect()
                .then(function () { return engine.close(); })
                .then(function () {
                expect(engine.isConnected()).toBe(false);
                stub.restore();
            });
        });
    });
    describe('drop', function () {
        it('drops the database', function () {
            var dropDatabase = sinon.stub().callsFake(function (cb) { return cb(null); });
            var stub = sinon.stub(MongoClient, 'connect')
                .callsFake(function (conn, cb) { return setImmediate(cb(null, { dropDatabase: dropDatabase })); });
            return engine.connect()
                .then(function () { return engine.drop(); })
                .then(function () { return expect(dropDatabase.callCount).toBe(1); })
                .then(function () { return stub.restore(); });
        });
        it('lazily connects to the database', function () {
            var dropDatabase = sinon.stub().callsFake(function (cb) { return cb(null); });
            var stub = sinon.stub(MongoClient, 'connect')
                .callsFake(function (conn, cb) { return setImmediate(cb(null, { dropDatabase: dropDatabase })); });
            return engine.drop()
                .then(function () { return expect(stub.callCount).toBe(1); })
                .then(function () { return expect(dropDatabase.callCount).toBe(1); })
                .then(function () { return stub.restore(); });
        });
    });
    describe('exec', function () {
        it('provides a client to the callback', function () {
            var stub = sinon.stub(MongoClient, 'connect')
                .callsFake(function (conn, cb) { return setImmediate(cb(null, 'fake client')); });
            return engine.connect()
                .then(function () { return engine.exec(function (client) { return expect(client).toEqual('fake client'); }); })
                .then(function () { return stub.restore(); });
        });
        it('lazily connects to the database', function () {
            var stub = sinon.stub(MongoClient, 'connect')
                .callsFake(function (conn, cb) { return setImmediate(cb(null, 'fake client')); });
            return engine.exec(function (client) { return expect(client).toEqual('fake client'); })
                .then(function () { return expect(stub.callCount).toBe(1); })
                .then(function () { return stub.restore(); });
        });
    });
});
describe('EngineNedb', function () {
    var engine;
    var removeStub;
    beforeEach(function () {
        removeStub = sinon.stub(Datastore.prototype, 'remove')
            .callsFake(function (query, options, cb) {
            cb(null);
        });
        return support_1.tmpFileName().then(function (path) {
            engine = new engine_1.EngineNedb(path, true);
        });
    });
    afterEach(function () {
        removeStub.restore();
    });
    describe('drop', function () {
        it('executes a multi remove', function () {
            return engine.drop()
                .then(function () {
                expect(removeStub.callCount).toBe(1);
                expect(removeStub.calledWith({}, { multi: true }, sinon.match.func))
                    .toBe(true);
            });
        });
    });
    describe('exec', function () {
        it('provides a client to the callback', function () {
            return engine.exec(function (client) {
                expect(client instanceof Datastore).toBe(true);
            });
        });
    });
});
describe('EnginePostgres', function () {
    var engine;
    beforeEach(function () {
        engine = new engine_1.EnginePostgres();
    });
    describe('isConnected', function () {
        it('defaults to false', function () {
            expect(engine.isConnected()).toBe(false);
        });
    });
    describe('connect', function () {
        it('connects to the database', function () {
            var stub = sinon.stub(PGClient.prototype, 'connect').resolves();
            return engine.connect()
                .then(function () {
                expect(stub.callCount).toBe(1);
                stub.restore();
            });
        });
        it('prevents multiple concurrent connections', function () {
            var stub = sinon.stub(PGClient.prototype, 'connect').resolves();
            return Promise.all([
                engine.connect(),
                engine.connect(),
                engine.connect()
            ]).then(function () {
                expect(stub.callCount).toBe(1);
                stub.restore();
            });
        });
        it('marks isConnected as true', function () {
            var stub = sinon.stub(PGClient.prototype, 'connect').resolves();
            return engine.connect()
                .then(function () {
                expect(engine.isConnected()).toBe(true);
                stub.restore();
            });
        });
    });
    describe('close', function () {
        it('closes connection to the database', function () {
            var connectStub = sinon.stub(PGClient.prototype, 'connect').resolves();
            var endStub = sinon.stub(PGClient.prototype, 'end').resolves();
            return engine.connect()
                .then(function () { return engine.close(); })
                .then(function () { return expect(endStub.callCount).toBe(1); })
                .then(function () {
                connectStub.restore();
                endStub.restore();
            });
        });
        it('marks isConnected as false', function () {
            var connectStub = sinon.stub(PGClient.prototype, 'connect').resolves();
            var endStub = sinon.stub(PGClient.prototype, 'end').resolves();
            return engine.connect()
                .then(function () { return engine.close(); })
                .then(function () {
                expect(engine.isConnected()).toBe(false);
                connectStub.restore();
                endStub.restore();
            });
        });
    });
    describe('drop', function () {
        it('truncates all tables', function () {
            var connectStub = sinon.stub(PGClient.prototype, 'connect').resolves();
            var queryStub = sinon.stub(PGClient.prototype, 'query').resolves();
            return engine.connect()
                .then(function () { return engine.drop(); })
                .then(function () {
                expect(queryStub.callCount).toBe(3);
                expect(queryStub.calledWith('TRUNCATE channel CASCADE'));
                expect(queryStub.calledWith('TRUNCATE payment CASCADE'));
                expect(queryStub.calledWith('TRUNCATE token CASCADE'));
                connectStub.restore();
                queryStub.restore();
            });
        });
        it('lazily connects to the database', function () {
            var connectStub = sinon.stub(PGClient.prototype, 'connect').resolves();
            var queryStub = sinon.stub(PGClient.prototype, 'query').resolves();
            return engine.drop()
                .then(function () {
                expect(connectStub.callCount).toBe(1);
                connectStub.restore();
                queryStub.restore();
            });
        });
    });
    describe('exec', function () {
        it('returns an instance of the client', function () {
            var connectStub = sinon.stub(PGClient.prototype, 'connect').resolves();
            return engine.connect()
                .then(function () { return engine.exec(function (client) { return expect(client instanceof PGClient).toBe(true); }); })
                .then(function () { return connectStub.restore(); });
        });
        it('lazily connects to the database', function () {
            var connectStub = sinon.stub(PGClient.prototype, 'connect').resolves();
            return engine.exec(function () { return 'beep'; })
                .then(function () { return expect(connectStub.callCount).toBe(1); })
                .then(function () { return connectStub.restore(); });
        });
    });
});
//# sourceMappingURL=engines.test.js.map