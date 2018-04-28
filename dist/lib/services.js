"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const channels_database_1 = require("./storages/channels_database");
const payments_database_1 = require("./storages/payments_database");
const channel_manager_1 = require("./channel_manager");
const tokens_database_1 = require("./storages/tokens_database");
const client_1 = require("./client");
const transport_1 = require("./transport");
const engine_1 = require("./engines/engine");
const container_1 = require("./container");
const chain_manager_1 = require("./chain_manager");
const channel_contract_1 = require("./channel_contract");
const PaymentManager_1 = require("./PaymentManager");
function defaultRegistry() {
    const serviceRegistry = new container_1.Registry();
    serviceRegistry.bind('ChainManager', (web3) => new chain_manager_1.default(web3), ['Web3']);
    serviceRegistry.bind('ChannelContract', (web3) => new channel_contract_1.default(web3), ['Web3']);
    serviceRegistry.bind('ChannelManager', (account, web3, channelsDao, paymentsDao, tokensDao, channelContract, paymentManager, machinomyOptions) => new channel_manager_1.ChannelManagerImpl(account, web3, channelsDao, paymentsDao, tokensDao, channelContract, paymentManager, machinomyOptions), ['account', 'Web3', 'ChannelsDatabase', 'PaymentsDatabase', 'TokensDatabase', 'ChannelContract', 'PaymentManager', 'MachinomyOptions']);
    serviceRegistry.bind('Client', (transport, channelManager) => {
        return new client_1.ClientImpl(transport, channelManager);
    }, ['Transport', 'ChannelManager']);
    serviceRegistry.bind('Transport', () => new transport_1.Transport());
    serviceRegistry.bind('Engine', (options) => {
        const splits = options.databaseUrl.split('://');
        switch (splits[0]) {
            case 'nedb':
                return new engine_1.EngineNedb(splits[1], false);
            case 'mongodb':
                return new engine_1.EngineMongo(options.databaseUrl);
            case 'postgresql':
                return new engine_1.EnginePostgres(options.databaseUrl);
        }
        throw new Error(`Invalid engine: ${splits[0]}.`);
    }, ['MachinomyOptions']);
    serviceRegistry.bind('ChannelsDatabase', (engine, channelContract, namespace) => {
        if (engine instanceof engine_1.EngineMongo) {
            return new channels_database_1.MongoChannelsDatabase(engine, channelContract, namespace);
        }
        if (engine instanceof engine_1.EnginePostgres) {
            return new channels_database_1.PostgresChannelsDatabase(engine, channelContract, namespace);
        }
        if (engine instanceof engine_1.EngineNedb) {
            return new channels_database_1.NedbChannelsDatabase(engine, channelContract, namespace);
        }
        throw new Error('Invalid engine.');
    }, ['Engine', 'ChannelContract', 'namespace']);
    serviceRegistry.bind('PaymentsDatabase', (engine, namespace) => {
        if (engine instanceof engine_1.EngineMongo) {
            return new payments_database_1.MongoPaymentsDatabase(engine, namespace);
        }
        if (engine instanceof engine_1.EnginePostgres) {
            return new payments_database_1.PostgresPaymentsDatabase(engine, namespace);
        }
        if (engine instanceof engine_1.EngineNedb) {
            return new payments_database_1.NedbPaymentsDatabase(engine, namespace);
        }
        throw new Error('Invalid engine.');
    }, ['Engine', 'namespace']);
    serviceRegistry.bind('TokensDatabase', (engine, namespace) => {
        if (engine instanceof engine_1.EngineMongo) {
            return new tokens_database_1.MongoTokensDatabase(engine, namespace);
        }
        if (engine instanceof engine_1.EnginePostgres) {
            return new tokens_database_1.PostgresTokensDatabase(engine, namespace);
        }
        if (engine instanceof engine_1.EngineNedb) {
            return new tokens_database_1.NedbTokensDatabase(engine, namespace);
        }
        throw new Error('Invalid engine.');
    }, ['Engine', 'namespace']);
    serviceRegistry.bind('PaymentManager', (chainManager, channelContract, options) => new PaymentManager_1.default(chainManager, channelContract, options), ['ChainManager', 'ChannelContract', 'MachinomyOptions']);
    return serviceRegistry;
}
exports.default = defaultRegistry;
//# sourceMappingURL=services.js.map