"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sinon = require("sinon");
var support = require("./support");
var channel = require("../lib/channel");
var payment_1 = require("../lib/payment");
var BigNumber = require("bignumber.js");
var engine_1 = require("../lib/engines/engine");
var payment_channel_1 = require("../lib/payment_channel");
var channels_database_1 = require("../lib/storages/channels_database");
var payments_database_1 = require("../lib/storages/payments_database");
var tokens_database_1 = require("../lib/storages/tokens_database");
var signature_1 = require("../lib/signature");
var expects_rejection_1 = require("./util/expects_rejection");
var expect = require('expect');
var engineName = process.env.ENGINE_NAME || 'nedb';
function buildEngine(filename) {
    switch (engineName) {
        case 'nedb':
            return new engine_1.EngineNedb(filename, false);
        case 'mongo':
            return new engine_1.EngineMongo('mongodb://localhost:27017/machinomy');
        case 'postgresql':
            return new engine_1.EnginePostgres();
        default:
            throw new Error("Invalid engine " + engineName + ".");
    }
}
function buildDatabases(engine, channelContract) {
    if (engine instanceof engine_1.EngineNedb) {
        return [new channels_database_1.NedbChannelsDatabase(engine, channelContract, null), new payments_database_1.NedbPaymentsDatabase(engine, null), new tokens_database_1.NedbTokensDatabase(engine, null)];
    }
    if (engine instanceof engine_1.EnginePostgres) {
        return [new channels_database_1.PostgresChannelsDatabase(engine, channelContract, null), new payments_database_1.PostgresPaymentsDatabase(engine, null), new tokens_database_1.PostgresTokensDatabase(engine, null)];
    }
    if (engine instanceof engine_1.EngineMongo) {
        return [new channels_database_1.MongoChannelsDatabase(engine, channelContract, null), new payments_database_1.MongoPaymentsDatabase(engine, null), new tokens_database_1.MongoTokensDatabase(engine, null)];
    }
    throw new Error('Invalid engine.');
}
describe('storage', function () {
    var engine;
    var channels;
    var payments;
    var tokens;
    var fakeContract;
    before(function () {
        return support.tmpFileName().then(function (filename) {
            engine = buildEngine(filename);
            fakeContract = {};
            fakeContract.channelById = sinon.stub();
            fakeContract.getState = function () {
                return Promise.resolve(0);
            };
            fakeContract.channelById.resolves([null, null, '2']);
            var databases = buildDatabases(engine, fakeContract);
            channels = databases[0];
            payments = databases[1];
            tokens = databases[2];
        });
    });
    after(function () {
        return engine.close();
    });
    afterEach(function () {
        return engine.drop();
    });
    describe('ChannelsDatabase', function () {
        describe('#updateState', function () {
            it('updates the state value', function () {
                var id = support.randomChannelId().toString();
                sinon.stub(channels.contract, 'getState').resolves(2);
                return channels.save(new payment_channel_1.PaymentChannel('sender', 'receiver', id, new BigNumber.BigNumber(69), new BigNumber.BigNumber(8), 0, undefined))
                    .then(function () { return channels.updateState(id, 2); })
                    .then(function () { return channels.firstById(id); })
                    .then(function (chan) { return expect(chan.state).toBe(2); });
            });
        });
        describe('#spend', function () {
            it('update spent amount', function () {
                var channelId = channel.id('0xdeadbeaf');
                var hexChannelId = channelId.toString();
                var paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), undefined, undefined);
                var spent = new BigNumber.BigNumber(33);
                return channels.save(paymentChannel).then(function () {
                    return channels.spend(channelId, spent);
                }).then(function () {
                    return channels.firstById(channelId);
                }).then(function (updated) {
                    expect(updated.channelId).toBe(hexChannelId);
                    expect(updated.spent).toEqual(spent);
                });
            });
        });
        describe('#save and #firstById', function () {
            it('match', function () {
                var channelId = channel.id('0xdeadbeaf');
                var hexChannelId = channelId.toString();
                var paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 0, undefined);
                return channels.save(paymentChannel).then(function () {
                    return channels.firstById(channelId);
                }).then(function (saved) {
                    expect(saved.toString()).toBe(paymentChannel.toString());
                });
            });
        });
        describe('#firstById', function () {
            it('return null if not found', function () {
                var channelId = support.randomChannelId();
                return channels.firstById(channelId).then(function (found) {
                    expect(found).toBeNull();
                });
            });
        });
        describe('#saveOrUpdate', function () {
            it('save new PaymentChannel', function () {
                var gs = channels.contract.getState;
                var cb = channels.contract.channelById;
                gs.resolves(0);
                cb.resolves([null, null, '10']);
                var channelId = support.randomChannelId();
                var hexChannelId = channelId.toString();
                var paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 0, undefined);
                return channels.firstById(channelId).then(function (found) {
                    expect(found).toBeNull();
                }).then(function () {
                    return channels.saveOrUpdate(paymentChannel);
                }).then(function () {
                    return channels.firstById(channelId);
                }).then(function (found) {
                    expect(JSON.stringify(found)).toBe(JSON.stringify(paymentChannel));
                });
            });
            it('update spent value on existing PaymentChannel', function () {
                var channelId = support.randomChannelId();
                var hexChannelId = channelId.toString();
                var spent = new BigNumber.BigNumber(5);
                var paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), undefined, undefined);
                var updatedPaymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), spent, undefined, undefined);
                return channels.save(paymentChannel).then(function () {
                    return channels.saveOrUpdate(updatedPaymentChannel);
                }).then(function () {
                    return channels.firstById(channelId);
                }).then(function (found) {
                    expect(found.spent).toEqual(spent);
                });
            });
        });
        describe('#deposit', function () {
            it('updates the channel value to the sum of the old value and new', function () {
                var cb = channels.contract.channelById;
                cb.resolves([null, null, '15']);
                var channelId = support.randomChannelId();
                var hexChannelId = channelId.toString();
                var newValue = new BigNumber.BigNumber(15);
                var paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), undefined, undefined);
                return channels.save(paymentChannel).then(function () {
                    return channels.deposit(hexChannelId, new BigNumber.BigNumber(5));
                }).then(function () {
                    return channels.firstById(channelId);
                }).then(function (found) {
                    expect(found.value).toEqual(newValue);
                });
            });
            it('throws an error if the channel does not exist', function () {
                return expects_rejection_1.default(channels.deposit('123-abc', new BigNumber.BigNumber(10)));
            });
        });
    });
    describe('#all', function () {
        it('return all the channels', function () {
            var channelId = support.randomChannelId();
            var hexChannelId = channelId.toString();
            var paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), undefined, undefined);
            return channels.save(paymentChannel).then(function () {
                return channels.all();
            }).then(function (found) {
                expect(found.length).toBe(1);
                var foundChannelId = found[0].channelId;
                expect(foundChannelId).toBe(hexChannelId);
            });
        });
    });
    describe('#allSettling', function () {
        it('returns all settling channels', function () {
            var channelId1 = support.randomChannelId();
            var channelId2 = support.randomChannelId();
            var hexChannelId1 = channelId1.toString();
            var hexChannelId2 = channelId2.toString();
            var paymentChannel1 = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId1, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 0, undefined);
            var paymentChannel2 = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId2, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 1, undefined);
            var getState = fakeContract.getState;
            getState.withArgs(hexChannelId2).resolves(1);
            return Promise.all([
                channels.save(paymentChannel1),
                channels.save(paymentChannel2)
            ]).then(function () {
                return channels.allSettling();
            }).then(function (found) {
                expect(found.length).toBe(1);
                expect(found[0].channelId).toBe(paymentChannel2.channelId);
            });
        });
    });
    describe('#allOpen', function () {
        it('returns all open channels', function () {
            var channelId1 = support.randomChannelId();
            var channelId2 = support.randomChannelId();
            var channelId3 = support.randomChannelId();
            var hexChannelId1 = channelId1.toString();
            var hexChannelId2 = channelId2.toString();
            var hexChannelId3 = channelId3.toString();
            var paymentChannel1 = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId1, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 0, undefined);
            var paymentChannel2 = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId2, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 1, undefined);
            var paymentChannel3 = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId3, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 2, undefined);
            return Promise.all([
                channels.save(paymentChannel1),
                channels.save(paymentChannel2),
                channels.save(paymentChannel3)
            ]).then(function () {
                return channels.allOpen();
            }).then(function (found) {
                expect(found.length).toBe(1);
                expect(found[0].channelId).toBe(paymentChannel1.channelId);
            });
        });
        describe('#findUsable', function () {
            it('returns the first channel for the specified sender and receiver whose value is less than the sum of the channel value and amount', function () {
                var correct = support.randomChannelId().toString();
                var remotelyModifiedId = support.randomChannelId().toString();
                var getState = fakeContract.getState;
                getState.withArgs(remotelyModifiedId).resolves(2);
                var instances = [
                    new payment_channel_1.PaymentChannel('sender', 'receiver', support.randomChannelId().toString(), new BigNumber.BigNumber(9), new BigNumber.BigNumber(8), 0, undefined),
                    new payment_channel_1.PaymentChannel('sender', 'receiver', correct, new BigNumber.BigNumber(13), new BigNumber.BigNumber(0), 0, undefined),
                    new payment_channel_1.PaymentChannel('sender', 'receiver', remotelyModifiedId, new BigNumber.BigNumber(13), new BigNumber.BigNumber(0), 0, undefined),
                    new payment_channel_1.PaymentChannel('sender', 'receiver', support.randomChannelId().toString(), new BigNumber.BigNumber(13), new BigNumber.BigNumber(0), 2, undefined),
                    new payment_channel_1.PaymentChannel('sender', 'receiver', support.randomChannelId().toString(), new BigNumber.BigNumber(130), new BigNumber.BigNumber(0), 1, undefined),
                    new payment_channel_1.PaymentChannel('othersender', 'receiver', support.randomChannelId().toString(), new BigNumber.BigNumber(11), new BigNumber.BigNumber(0), 0, undefined),
                    new payment_channel_1.PaymentChannel('othersender', 'receiver', support.randomChannelId().toString(), new BigNumber.BigNumber(11), new BigNumber.BigNumber(0), 2, undefined)
                ];
                var cb = channels.contract.channelById;
                instances.forEach(function (chan) {
                    cb.withArgs(chan.channelId).resolves([null, null, chan.value.toString()]);
                });
                return Promise.all(instances.map(function (chan) { return channels.save(chan); }))
                    .then(function () { return channels; }).then(function (channels) { return channels.findUsable('sender', 'receiver', new BigNumber.BigNumber(2)); })
                    .then(function (channel) { return expect(channel.channelId.toString()).toEqual(correct); });
            });
        });
    });
    describe('TokensDatabase', function () {
        describe('#isPresent', function () {
            it('check if non-existent token is absent', function () {
                var randomToken = support.randomInteger().toString();
                return tokens.isPresent(randomToken).then(function (isPresent) {
                    expect(isPresent).toBeFalsy();
                });
            });
            it('check if existing token is present', function () {
                var randomToken = support.randomInteger().toString();
                var channelId = support.randomChannelId();
                return channels.save(new payment_channel_1.PaymentChannel('sender', 'receiver', channelId.toString(), new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), undefined, undefined))
                    .then(function () {
                    return tokens.save(randomToken, channelId).then(function () {
                        return tokens.isPresent(randomToken);
                    }).then(function (isPresent) {
                        expect(isPresent).toBeTruthy();
                    });
                });
            });
        });
        describe('PaymentsDatabase', function () {
            describe('#save and #firstMaximum', function () {
                it('match the data', function () {
                    var randomToken = support.randomInteger().toString();
                    var channelId = support.randomChannelId();
                    var payment = new payment_1.default({
                        channelId: channelId.toString(),
                        sender: 'sender',
                        receiver: 'receiver',
                        price: new BigNumber.BigNumber(10),
                        value: new BigNumber.BigNumber(12),
                        channelValue: new BigNumber.BigNumber(10),
                        meta: 'metaexample',
                        signature: signature_1.default.fromParts({
                            v: 27,
                            r: '0x2',
                            s: '0x3'
                        }),
                        token: undefined,
                        contractAddress: undefined
                    });
                    sinon.stub(Date, 'now').returns(12345);
                    return channels.save(new payment_channel_1.PaymentChannel('sender', 'receiver', channelId.toString(), new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), undefined, undefined))
                        .then(function () {
                        return payments.save(randomToken, payment).then(function () {
                            return payments.firstMaximum(channelId);
                        });
                    }).then(function (found) {
                        expect(found.channelId).toBe(payment.channelId);
                        expect(found.token).toBe(randomToken);
                        expect(found.signature.isEqual(payment.signature)).toBe(true);
                        expect(found.createdAt).toBe(12345);
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=storage.test.js.map