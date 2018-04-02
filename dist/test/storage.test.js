"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const support = require("./support");
const ChannelId_1 = require("../lib/ChannelId");
const payment_1 = require("../lib/payment");
const BigNumber = require("bignumber.js");
const engine_1 = require("../lib/engines/engine");
const payment_channel_1 = require("../lib/payment_channel");
const channels_database_1 = require("../lib/storages/channels_database");
const payments_database_1 = require("../lib/storages/payments_database");
const tokens_database_1 = require("../lib/storages/tokens_database");
const signature_1 = require("../lib/signature");
const expects_rejection_1 = require("./util/expects_rejection");
const expect = require('expect');
const engineName = process.env.ENGINE_NAME || 'nedb';
function buildEngine(filename) {
    switch (engineName) {
        case 'nedb':
            return new engine_1.EngineNedb(filename, false);
        case 'mongo':
            return new engine_1.EngineMongo('mongodb://localhost:27017/machinomy');
        case 'postgresql':
            return new engine_1.EnginePostgres();
        default:
            throw new Error(`Invalid engine ${engineName}.`);
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
describe('storage', () => {
    let engine;
    let channels;
    let payments;
    let tokens;
    let fakeContract;
    before(() => {
        return support.tmpFileName().then(filename => {
            engine = buildEngine(filename);
            fakeContract = {};
            fakeContract.channelById = sinon.stub();
            fakeContract.getState = () => {
                return Promise.resolve(0);
            };
            fakeContract.channelById.resolves([null, null, '2']);
            const databases = buildDatabases(engine, fakeContract);
            channels = databases[0];
            payments = databases[1];
            tokens = databases[2];
        });
    });
    after(() => {
        return engine.close();
    });
    afterEach(() => {
        return engine.drop();
    });
    describe('ChannelsDatabase', () => {
        describe('#updateState', () => {
            it('updates the state value', () => {
                const id = ChannelId_1.default.random().toString();
                sinon.stub(channels.contract, 'getState').resolves(2);
                return channels.save(new payment_channel_1.PaymentChannel('sender', 'receiver', id, new BigNumber.BigNumber(69), new BigNumber.BigNumber(8), 0, undefined))
                    .then(() => channels.updateState(id, 2))
                    .then(() => channels.firstById(id))
                    .then((chan) => expect(chan.state).toBe(2));
            });
        });
        describe('#spend', () => {
            it('update spent amount', () => {
                const channelId = ChannelId_1.default.build('0xdeadbeaf');
                const hexChannelId = channelId.toString();
                const paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), undefined, undefined);
                const spent = new BigNumber.BigNumber(33);
                return channels.save(paymentChannel).then(() => {
                    return channels.spend(channelId, spent);
                }).then(() => {
                    return channels.firstById(channelId);
                }).then((updated) => {
                    expect(updated.channelId).toBe(hexChannelId);
                    expect(updated.spent).toEqual(spent);
                });
            });
        });
        describe('#save and #firstById', () => {
            it('match', () => {
                const channelId = ChannelId_1.default.build('0xdeadbeaf');
                const hexChannelId = channelId.toString();
                const paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 0, undefined);
                return channels.save(paymentChannel).then(() => {
                    return channels.firstById(channelId);
                }).then((saved) => {
                    expect(saved.toString()).toBe(paymentChannel.toString());
                });
            });
        });
        describe('#firstById', () => {
            it('return null if not found', () => {
                const channelId = ChannelId_1.default.random();
                return channels.firstById(channelId).then((found) => {
                    expect(found).toBeNull();
                });
            });
        });
        describe('#saveOrUpdate', () => {
            it('save new PaymentChannel', () => {
                const gs = channels.contract.getState;
                const cb = channels.contract.channelById;
                gs.resolves(0);
                cb.resolves([null, null, '10']);
                const channelId = ChannelId_1.default.random();
                const hexChannelId = channelId.toString();
                const paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 0, undefined);
                return channels.firstById(channelId).then((found) => {
                    expect(found).toBeNull();
                }).then(() => {
                    return channels.saveOrUpdate(paymentChannel);
                }).then(() => {
                    return channels.firstById(channelId);
                }).then((found) => {
                    expect(JSON.stringify(found)).toBe(JSON.stringify(paymentChannel));
                });
            });
            it('update spent value on existing PaymentChannel', () => {
                const channelId = ChannelId_1.default.random();
                const hexChannelId = channelId.toString();
                const spent = new BigNumber.BigNumber(5);
                const paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), undefined, undefined);
                const updatedPaymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), spent, undefined, undefined);
                return channels.save(paymentChannel).then(() => {
                    return channels.saveOrUpdate(updatedPaymentChannel);
                }).then(() => {
                    return channels.firstById(channelId);
                }).then((found) => {
                    expect(found.spent).toEqual(spent);
                });
            });
        });
        describe('#deposit', () => {
            it('updates the channel value to the sum of the old value and new', () => {
                const cb = channels.contract.channelById;
                cb.resolves([null, null, '15']);
                const channelId = ChannelId_1.default.random();
                const hexChannelId = channelId.toString();
                const newValue = new BigNumber.BigNumber(15);
                const paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), undefined, undefined);
                return channels.save(paymentChannel).then(() => {
                    return channels.deposit(hexChannelId, new BigNumber.BigNumber(5));
                }).then(() => {
                    return channels.firstById(channelId);
                }).then((found) => {
                    expect(found.value).toEqual(newValue);
                });
            });
            it('throws an error if the channel does not exist', () => {
                return expects_rejection_1.default(channels.deposit('123-abc', new BigNumber.BigNumber(10)));
            });
        });
    });
    describe('#all', () => {
        it('return all the channels', () => {
            const channelId = ChannelId_1.default.random();
            const hexChannelId = channelId.toString();
            const paymentChannel = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), undefined, undefined);
            return channels.save(paymentChannel).then(() => {
                return channels.all();
            }).then((found) => {
                expect(found.length).toBe(1);
                const foundChannelId = found[0].channelId;
                expect(foundChannelId).toBe(hexChannelId);
            });
        });
    });
    describe('#allSettling', () => {
        it('returns all settling channels', () => {
            const channelId1 = ChannelId_1.default.random();
            const channelId2 = ChannelId_1.default.random();
            const hexChannelId1 = channelId1.toString();
            const hexChannelId2 = channelId2.toString();
            const paymentChannel1 = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId1, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 0, undefined);
            const paymentChannel2 = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId2, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 1, undefined);
            const getState = fakeContract.getState;
            getState.withArgs(hexChannelId2).resolves(1);
            return Promise.all([
                channels.save(paymentChannel1),
                channels.save(paymentChannel2)
            ]).then(() => {
                return channels.allSettling();
            }).then(found => {
                expect(found.length).toBe(1);
                expect(found[0].channelId).toBe(paymentChannel2.channelId);
            });
        });
    });
    describe('#allOpen', () => {
        it('returns all open channels', () => {
            const channelId1 = ChannelId_1.default.random();
            const channelId2 = ChannelId_1.default.random();
            const channelId3 = ChannelId_1.default.random();
            const hexChannelId1 = channelId1.toString();
            const hexChannelId2 = channelId2.toString();
            const hexChannelId3 = channelId3.toString();
            const paymentChannel1 = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId1, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 0, undefined);
            const paymentChannel2 = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId2, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 1, undefined);
            const paymentChannel3 = new payment_channel_1.PaymentChannel('sender', 'receiver', hexChannelId3, new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), 2, undefined);
            return Promise.all([
                channels.save(paymentChannel1),
                channels.save(paymentChannel2),
                channels.save(paymentChannel3)
            ]).then(() => {
                return channels.allOpen();
            }).then(found => {
                expect(found.length).toBe(1);
                expect(found[0].channelId).toBe(paymentChannel1.channelId);
            });
        });
        describe('#findUsable', () => {
            it('returns the first channel for the specified sender and receiver whose value is less than the sum of the channel value and amount', () => {
                const correct = ChannelId_1.default.random().toString();
                const remotelyModifiedId = ChannelId_1.default.random().toString();
                const getState = fakeContract.getState;
                getState.withArgs(remotelyModifiedId).resolves(2);
                const instances = [
                    new payment_channel_1.PaymentChannel('sender', 'receiver', ChannelId_1.default.random().toString(), new BigNumber.BigNumber(9), new BigNumber.BigNumber(8), 0, undefined),
                    new payment_channel_1.PaymentChannel('sender', 'receiver', correct, new BigNumber.BigNumber(13), new BigNumber.BigNumber(0), 0, undefined),
                    new payment_channel_1.PaymentChannel('sender', 'receiver', remotelyModifiedId, new BigNumber.BigNumber(13), new BigNumber.BigNumber(0), 0, undefined),
                    new payment_channel_1.PaymentChannel('sender', 'receiver', ChannelId_1.default.random().toString(), new BigNumber.BigNumber(13), new BigNumber.BigNumber(0), 2, undefined),
                    new payment_channel_1.PaymentChannel('sender', 'receiver', ChannelId_1.default.random().toString(), new BigNumber.BigNumber(130), new BigNumber.BigNumber(0), 1, undefined),
                    new payment_channel_1.PaymentChannel('othersender', 'receiver', ChannelId_1.default.random().toString(), new BigNumber.BigNumber(11), new BigNumber.BigNumber(0), 0, undefined),
                    new payment_channel_1.PaymentChannel('othersender', 'receiver', ChannelId_1.default.random().toString(), new BigNumber.BigNumber(11), new BigNumber.BigNumber(0), 2, undefined)
                ];
                const cb = channels.contract.channelById;
                instances.forEach((chan) => {
                    cb.withArgs(chan.channelId).resolves([null, null, chan.value.toString()]);
                });
                return Promise.all(instances.map((chan) => channels.save(chan)))
                    .then(() => channels).then((channels) => channels.findUsable('sender', 'receiver', new BigNumber.BigNumber(2)))
                    .then((channel) => expect(channel.channelId.toString()).toEqual(correct));
            });
        });
    });
    describe('TokensDatabase', () => {
        describe('#isPresent', () => {
            it('check if non-existent token is absent', () => {
                const randomToken = support.randomInteger().toString();
                return tokens.isPresent(randomToken).then((isPresent) => {
                    expect(isPresent).toBeFalsy();
                });
            });
            it('check if existing token is present', () => {
                const randomToken = support.randomInteger().toString();
                const channelId = ChannelId_1.default.random();
                return channels.save(new payment_channel_1.PaymentChannel('sender', 'receiver', channelId.toString(), new BigNumber.BigNumber(10), new BigNumber.BigNumber(0), undefined, undefined))
                    .then(() => {
                    return tokens.save(randomToken, channelId).then(() => {
                        return tokens.isPresent(randomToken);
                    }).then((isPresent) => {
                        expect(isPresent).toBeTruthy();
                    });
                });
            });
        });
        describe('PaymentsDatabase', () => {
            describe('#save and #firstMaximum', () => {
                it('match the data', () => {
                    const randomToken = support.randomInteger().toString();
                    const channelId = ChannelId_1.default.random();
                    const payment = new payment_1.default({
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
                        .then(() => {
                        return payments.save(randomToken, payment).then(() => {
                            return payments.firstMaximum(channelId);
                        });
                    }).then((found) => {
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