"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const namespaced_1 = require("../util/namespaced");
const pify_1 = require("../util/pify");
class AbstractTokensDatabase {
    constructor(engine, namespace) {
        this.kind = namespaced_1.namespaced(namespace, 'token');
        this.engine = engine;
    }
}
exports.AbstractTokensDatabase = AbstractTokensDatabase;
/**
 * Database layer for tokens.
 */
class MongoTokensDatabase extends AbstractTokensDatabase {
    save(token, channelId) {
        return this.engine.exec((client) => {
            const tokenDocument = {
                kind: this.kind,
                token: token.toString(),
                channelId: channelId.toString()
            };
            return pify_1.default((cb) => client.collection('token').insert(tokenDocument, cb));
        });
    }
    isPresent(token) {
        return this.engine.exec((client) => {
            const query = { kind: this.kind, token: token };
            return pify_1.default((cb) => client.collection('token').count(query, { limit: 1 }, cb));
        }).then((res) => (res > 0));
    }
}
exports.MongoTokensDatabase = MongoTokensDatabase;
class NedbTokensDatabase extends AbstractTokensDatabase {
    save(token, channelId) {
        return this.engine.exec((client) => {
            const tokenDocument = {
                kind: this.kind,
                token: token.toString(),
                channelId: channelId.toString()
            };
            return pify_1.default((cb) => client.insert(tokenDocument, cb));
        });
    }
    isPresent(token) {
        return this.engine.exec((client) => {
            const query = { kind: this.kind, token: token };
            return pify_1.default((cb) => client.count(query, cb));
        }).then((res) => (res > 0));
    }
}
exports.NedbTokensDatabase = NedbTokensDatabase;
class PostgresTokensDatabase extends AbstractTokensDatabase {
    save(token, channelId) {
        return this.engine.exec((client) => client.query('INSERT INTO token(token, "channelId", kind) VALUES ($1, $2, $3)', [
            token,
            channelId.toString(),
            this.kind
        ]));
    }
    isPresent(token) {
        return this.engine.exec((client) => client.query('SELECT COUNT(*) as count FROM token WHERE token=$1', [
            token
        ])).then((res) => (res.rows[0].count > 0));
    }
}
exports.PostgresTokensDatabase = PostgresTokensDatabase;
//# sourceMappingURL=tokens_database.js.map