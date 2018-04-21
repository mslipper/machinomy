"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payment_1 = require("../payment");
const pify_1 = require("../util/pify");
const namespaced_1 = require("../util/namespaced");
class AbstractPaymentsDatabase {
    constructor(engine, namespace) {
        this.kind = namespaced_1.namespaced(namespace, 'payment');
        this.engine = engine;
    }
    inflatePayment(json) {
        if (!json) {
            return null;
        }
        return payment_1.PaymentSerde.instance.deserialize(json);
    }
}
exports.AbstractPaymentsDatabase = AbstractPaymentsDatabase;
/**
 * Database layer for payments.
 */
class MongoPaymentsDatabase extends AbstractPaymentsDatabase {
    /**
     * Save payment to the database, to check later.
     */
    save(token, payment) {
        const serialized = payment_1.PaymentSerde.instance.serialize(payment);
        serialized.kind = this.kind;
        serialized.token = token;
        serialized.createdAt = Date.now();
        // log.info(`Saving payment for channel ${payment.channelId} and token ${token}`)
        return this.engine.exec((client) => pify_1.default((cb) => client.collection('payment').insert(serialized, cb)));
    }
    /**
     * Find a payment with maximum value on it inside the channel.
     */
    firstMaximum(channelId) {
        // log.info(`Trying to find last payment for channel ${channelId.toString()}`)
        let query = { kind: this.kind, channelId: channelId.toString() };
        return this.engine.exec((client) => pify_1.default((cb) => client.collection('payment')
            .find(query).sort({ value: -1 }).limit(1).toArray(cb)))
            .then((res) => this.inflatePayment(res[0]));
    }
    /**
     * Find a payment by token.
     */
    findByToken(token) {
        let query = { kind: this.kind, token: token };
        return this.engine.exec((client) => pify_1.default((cb) => client.collection('payment').findOne(query, cb)))
            .then((res) => this.inflatePayment(res));
    }
}
exports.MongoPaymentsDatabase = MongoPaymentsDatabase;
class NedbPaymentsDatabase extends AbstractPaymentsDatabase {
    save(token, payment) {
        const serialized = payment_1.PaymentSerde.instance.serialize(payment);
        serialized.kind = this.kind;
        serialized.token = token;
        serialized.createdAt = Date.now();
        // log.info(`Saving payment for channel ${payment.channelId} and token ${token}`)
        return this.engine.exec((client) => pify_1.default((cb) => client.insert(serialized, cb)));
    }
    /**
     * Find a payment with maximum value on it inside the channel.
     */
    firstMaximum(channelId) {
        // log.info(`Trying to find last payment for channel ${channelId.toString()}`)
        let query = { kind: this.kind, channelId: channelId.toString() };
        return this.engine.exec((client) => pify_1.default((cb) => client.findOne(query).sort({ value: -1 }).exec(cb)))
            .then((res) => this.inflatePayment(res));
    }
    /**
     * Find a payment by token.
     */
    findByToken(token) {
        let query = { kind: this.kind, token: token };
        return this.engine.exec((client) => pify_1.default((cb) => client.findOne(query, cb)))
            .then((res) => this.inflatePayment(res));
    }
}
exports.NedbPaymentsDatabase = NedbPaymentsDatabase;
class PostgresPaymentsDatabase extends AbstractPaymentsDatabase {
    save(token, payment) {
        const serialized = payment_1.PaymentSerde.instance.serialize(payment);
        serialized.kind = this.kind;
        serialized.token = token;
        return this.engine.exec((client) => client.query('INSERT INTO payment("channelId", kind, token, sender, receiver, price, value, ' +
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
        ]));
    }
    firstMaximum(channelId) {
        return this.engine.exec((client) => client.query('SELECT "channelId", kind, token, sender, receiver, price, value, ' +
            '"channelValue", v, r, s, meta, "contractAddress", "createdAt" FROM payment WHERE "channelId" = $1 ' +
            'ORDER BY value DESC', [
            channelId.toString()
        ])).then((res) => this.inflatePayment(res.rows[0]));
    }
    findByToken(token) {
        return this.engine.exec((client) => client.query('SELECT "channelId", kind, token, sender, receiver, price, value, ' +
            '"channelValue", v, r, s, meta, "contractAddress", "createdAt" FROM payment WHERE token = $1', [
            token
        ])).then((res) => this.inflatePayment(res.rows[0]));
    }
}
exports.PostgresPaymentsDatabase = PostgresPaymentsDatabase;
//# sourceMappingURL=payments_database.js.map