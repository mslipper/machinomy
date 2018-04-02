"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payment_channel_1 = require("../payment_channel");
const namespaced_1 = require("../util/namespaced");
const pify_1 = require("../util/pify");
const log_1 = require("../util/log");
const LOG = log_1.default('AbstractChannelsDatabase');
class AbstractChannelsDatabase {
    constructor(engine, channelContract, namespace) {
        this.kind = namespaced_1.namespaced(namespace, 'channel');
        this.engine = engine;
        this.contract = channelContract;
    }
    inflatePaymentChannels(channels) {
        if (!channels.length) {
            return Promise.resolve([]);
        }
        // There shouldn't be any nulls here.
        return Promise.all(channels.map((chan) => this.inflatePaymentChannel(chan)));
    }
    async inflatePaymentChannel(json) {
        if (!json) {
            return Promise.resolve(null);
        }
        const state = await this.contract.getState(json.channelId);
        const value = (await this.contract.channelById(json.channelId))[2];
        const doc = payment_channel_1.PaymentChannel.fromDocument(json);
        return new payment_channel_1.PaymentChannel(doc.sender, doc.receiver, doc.channelId, value, doc.spent, state === -1 ? 2 : state, doc.contractAddress || undefined);
    }
    filterByState(state, channels) {
        return channels.filter((chan) => chan.state === state);
    }
    saveOrUpdate(paymentChannel) {
        LOG(`Saving or updating channel with ID ${paymentChannel.channelId.toString()}`);
        return this.firstById(paymentChannel.channelId).then((found) => {
            if (found) {
                LOG(`Spending channel with ID ${paymentChannel.channelId.toString()}`);
                return this.spend(paymentChannel.channelId, paymentChannel.spent);
            }
            else {
                LOG(`Spending channel with ID ${paymentChannel.channelId.toString()}`);
                return this.save(paymentChannel);
            }
        });
    }
    async allSettling() {
        const all = await this.all();
        return this.filterByState(1, all);
    }
}
exports.AbstractChannelsDatabase = AbstractChannelsDatabase;
/**
 * Database layer for {PaymentChannel}
 */
class NedbChannelsDatabase extends AbstractChannelsDatabase {
    save(paymentChannel) {
        return this.engine.exec((client) => {
            const document = {
                kind: this.kind,
                sender: paymentChannel.sender,
                receiver: paymentChannel.receiver,
                value: paymentChannel.value.toString(),
                spent: paymentChannel.spent.toString(),
                channelId: paymentChannel.channelId,
                state: paymentChannel.state,
                contractAddress: paymentChannel.contractAddress
            };
            return pify_1.default((cb) => client.insert(document, cb));
        });
    }
    firstById(channelId) {
        return this.engine.exec((client) => {
            const query = {
                kind: this.kind,
                channelId: channelId.toString()
            };
            return pify_1.default((cb) => client.find(query, cb));
        }).then((doc) => this.inflatePaymentChannel(doc[0]));
    }
    /**
     * Set amount of money spent on the channel.
     */
    spend(channelId, spent) {
        return this.engine.exec((client) => {
            const query = {
                kind: this.kind,
                channelId: channelId.toString()
            };
            const update = {
                $set: {
                    spent: spent.toString()
                }
            };
            return pify_1.default((cb) => client.update(query, update, {}, cb));
        });
    }
    deposit(channelId, value) {
        return this.engine.exec(async (client) => {
            const channel = await this.firstById(channelId);
            if (!channel) {
                throw new Error('Channel not found.');
            }
            const query = {
                kind: this.kind,
                channelId: channelId.toString()
            };
            const newValue = channel.value.add(value);
            const update = {
                $set: {
                    value: newValue.toString()
                }
            };
            return pify_1.default((cb) => client.update(query, update, {}, cb));
        });
    }
    /**
     * Retrieve all the payment channels stored.
     *
     * @return {Promise<PaymentChannel>}
     */
    all() {
        return this.engine.exec((client) => {
            return pify_1.default((cb) => client.find({ kind: this.kind }, cb));
        }).then((res) => this.inflatePaymentChannels(res));
    }
    allOpen() {
        return this.engine.exec((client) => {
            return pify_1.default((cb) => client.find({ kind: this.kind, state: 0 }, cb));
        }).then((res) => this.inflatePaymentChannels(res))
            .then((chans) => this.filterByState(0, chans));
    }
    findUsable(sender, receiver, amount) {
        return this.engine.exec((client) => {
            const query = {
                kind: this.kind,
                state: 0,
                sender,
                receiver
            };
            return pify_1.default((cb) => client.find(query, cb));
        }).then((res) => this.inflatePaymentChannels(res))
            .then((channels) => this.filterByState(0, channels))
            .then((res) => {
            return res.find((chan) => chan.value.greaterThanOrEqualTo(chan.spent.add(amount))) || null;
        });
    }
    findBySenderReceiver(sender, receiver) {
        return this.engine.exec((client) => {
            return pify_1.default((cb) => client.find({ sender, receiver, kind: this.kind }, cb));
        }).then((res) => this.inflatePaymentChannels(res));
    }
    findBySenderReceiverChannelId(sender, receiver, channelId) {
        return this.engine.exec((client) => {
            return pify_1.default((cb) => client.find({
                sender,
                receiver,
                channelId: channelId.toString(),
                kind: this.kind
            }, cb));
        }).then((res) => this.inflatePaymentChannel(res[0]));
    }
    updateState(channelId, state) {
        return this.engine.exec((client) => {
            const query = {
                kind: this.kind,
                channelId: channelId.toString()
            };
            const update = {
                $set: {
                    state
                }
            };
            return pify_1.default((cb) => client.update(query, update, {}, cb));
        });
    }
}
exports.NedbChannelsDatabase = NedbChannelsDatabase;
class MongoChannelsDatabase extends AbstractChannelsDatabase {
    save(paymentChannel) {
        return this.engine.exec((client) => {
            const document = {
                kind: this.kind,
                sender: paymentChannel.sender,
                receiver: paymentChannel.receiver,
                value: paymentChannel.value.toString(),
                spent: paymentChannel.spent.toString(),
                channelId: paymentChannel.channelId,
                state: paymentChannel.state,
                contractAddress: paymentChannel.contractAddress
            };
            return pify_1.default((cb) => client.collection('channel').insert(document, cb));
        });
    }
    firstById(channelId) {
        return this.engine.exec((client) => {
            const query = {
                kind: this.kind,
                channelId: channelId.toString()
            };
            return pify_1.default((cb) => client.collection('channel').findOne(query, cb));
        }).then((doc) => {
            if (!doc) {
                return null;
            }
            return this.inflatePaymentChannel(doc);
        });
    }
    /**
     * Set amount of money spent on the channel.
     */
    spend(channelId, spent) {
        return this.engine.exec((client) => {
            const query = {
                kind: this.kind,
                channelId: channelId.toString()
            };
            const update = {
                $set: {
                    spent: spent.toString()
                }
            };
            return pify_1.default((cb) => client.collection('channel').update(query, update, {}, cb));
        });
    }
    deposit(channelId, value) {
        return this.engine.exec(async (client) => {
            const channel = await this.firstById(channelId);
            if (!channel) {
                throw new Error('Channel not found.');
            }
            const query = {
                kind: this.kind,
                channelId: channelId.toString()
            };
            const newValue = channel.value.add(value);
            const update = {
                $set: {
                    value: newValue.toString()
                }
            };
            return pify_1.default((cb) => client.collection('channel').update(query, update, {}, cb));
        });
    }
    /**
     * Retrieve all the payment channels stored.
     *
     * @return {Promise<PaymentChannel>}
     */
    all() {
        return this.engine.exec((client) => {
            return pify_1.default((cb) => client.collection('channel').find({}).toArray(cb));
        }).then((res) => this.inflatePaymentChannels(res));
    }
    allOpen() {
        return this.engine.exec((client) => {
            return pify_1.default((cb) => client.collection('channel').find({ state: 0 }).toArray(cb));
        }).then((res) => this.inflatePaymentChannels(res))
            .then((chans) => this.filterByState(0, chans));
    }
    findUsable(sender, receiver, amount) {
        return this.engine.exec((client) => {
            const query = {
                sender,
                receiver,
                state: 0
            };
            return pify_1.default((cb) => client.collection('channel').find(query).toArray(cb));
        }).then((res) => this.inflatePaymentChannels(res))
            .then((channels) => this.filterByState(0, channels))
            .then((res) => {
            return res.find((chan) => chan.value.greaterThanOrEqualTo(chan.spent.add(amount))) || null;
        });
    }
    findBySenderReceiver(sender, receiver) {
        return this.engine.exec((client) => {
            return pify_1.default((cb) => client.collection('channel').find({ sender, receiver }).toArray(cb));
        }).then((res) => this.inflatePaymentChannels(res));
    }
    findBySenderReceiverChannelId(sender, receiver, channelId) {
        return this.engine.exec((client) => {
            return pify_1.default((cb) => client.collection('channel').find({
                sender,
                receiver,
                channelId: channelId.toString()
            }).toArray(cb));
        }).then((res) => this.inflatePaymentChannel(res[0]));
    }
    updateState(channelId, state) {
        return this.engine.exec((client) => {
            const query = {
                kind: this.kind,
                channelId: channelId.toString()
            };
            const update = {
                $set: {
                    state
                }
            };
            return pify_1.default((cb) => client.collection('channel').update(query, update, {}, cb));
        });
    }
}
exports.MongoChannelsDatabase = MongoChannelsDatabase;
class PostgresChannelsDatabase extends AbstractChannelsDatabase {
    save(paymentChannel) {
        return this.engine.exec((client) => client.query('INSERT INTO channel("channelId", kind, sender, receiver, value, spent, state, "contractAddress") ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
            paymentChannel.channelId,
            this.kind,
            paymentChannel.sender,
            paymentChannel.receiver,
            paymentChannel.value.toString(),
            paymentChannel.spent.toString(),
            paymentChannel.state,
            paymentChannel.contractAddress
        ]));
    }
    firstById(channelId) {
        return this.engine.exec((client) => client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel ' +
            'WHERE "channelId" = $1 LIMIT 1', [
            channelId.toString()
        ])).then((res) => this.inflatePaymentChannel(res.rows[0]));
    }
    spend(channelId, spent) {
        return this.engine.exec((client) => client.query('UPDATE channel SET spent = $2 WHERE "channelId" = $1', [
            channelId.toString(),
            spent.toString()
        ]));
    }
    deposit(channelId, value) {
        return this.engine.exec(async (client) => {
            const channel = await this.firstById(channelId);
            if (!channel) {
                throw new Error('Channel not found.');
            }
            const newValue = channel.value.add(value);
            return client.query('UPDATE channel SET value = $2 WHERE "channelId" = $1', [
                channelId.toString(),
                newValue.toString()
            ]);
        });
    }
    all() {
        return this.engine.exec((client) => client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel')).then((res) => this.inflatePaymentChannels(res.rows));
    }
    allOpen() {
        return this.engine.exec((client) => client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel ' +
            'WHERE state = 0')).then((res) => this.inflatePaymentChannels(res.rows))
            .then((chans) => this.filterByState(0, chans));
    }
    findUsable(sender, receiver, amount) {
        return this.engine.exec((client) => client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel ' +
            'WHERE sender = $1 AND receiver = $2 AND value >= spent + $3 AND state = 0', [
            sender,
            receiver,
            amount.toString()
        ])).then((res) => this.inflatePaymentChannel(res.rows[0]))
            .then((channel) => this.filterByState(0, [channel])[0] || null);
    }
    findBySenderReceiver(sender, receiver) {
        return this.engine.exec((client) => client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel ' +
            'WHERE sender = $1 AND receiver = $2', [
            sender,
            receiver
        ])).then((res) => this.inflatePaymentChannels(res.rows));
    }
    findBySenderReceiverChannelId(sender, receiver, channelId) {
        return this.engine.exec((client) => client.query('SELECT "channelId", kind, sender, receiver, value, spent, state, "contractAddress" FROM channel ' +
            'WHERE sender = $1 AND receiver = $2 AND "channelId" = $3 LIMIT 1', [
            sender,
            receiver,
            channelId.toString()
        ])).then((res) => this.inflatePaymentChannel(res.rows[0]));
    }
    updateState(channelId, state) {
        return this.engine.exec((client) => client.query('UPDATE channel SET state = $1 WHERE "channelId" = $2', [
            state,
            channelId.toString()
        ]));
    }
}
exports.PostgresChannelsDatabase = PostgresChannelsDatabase;
//# sourceMappingURL=channels_database.js.map