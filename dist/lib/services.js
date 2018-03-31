"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var channels_database_1 = require("./storages/channels_database");
var payments_database_1 = require("./storages/payments_database");
var channel_manager_1 = require("./channel_manager");
var tokens_database_1 = require("./storages/tokens_database");
var client_1 = require("./client");
var transport_1 = require("./transport");
var engine_1 = require("./engines/engine");
var container_1 = require("./container");
var chain_manager_1 = require("./chain_manager");
var channel_contract_1 = require("./channel_contract");
var payment_manager_1 = require("./payment_manager");
function defaultRegistry() {
    var serviceRegistry = new container_1.Registry();
    serviceRegistry.bind('ChainManager', function (web3) { return new chain_manager_1.default(web3); }, ['Web3']);
    serviceRegistry.bind('ChannelContract', function (web3) { return new channel_contract_1.default(web3); }, ['Web3']);
    serviceRegistry.bind('ChannelManager', function (account, web3, channelsDao, paymentsDao, tokensDao, channelContract, paymentManager, machinomyOptions) { return new channel_manager_1.ChannelManagerImpl(account, web3, channelsDao, paymentsDao, tokensDao, channelContract, paymentManager, machinomyOptions); }, ['account', 'Web3', 'ChannelsDatabase', 'PaymentsDatabase', 'TokensDatabase', 'ChannelContract', 'PaymentManager', 'MachinomyOptions']);
    serviceRegistry.bind('Client', function (transport, channelManager) {
        return new client_1.ClientImpl(transport, channelManager);
    }, ['Transport', 'ChannelManager']);
    serviceRegistry.bind('Transport', function () { return new transport_1.Transport(); });
    serviceRegistry.bind('Engine', function (options) {
        var splits = options.databaseUrl.split('://');
        switch (splits[0]) {
            case 'nedb':
                return new engine_1.EngineNedb(splits[1], false);
            case 'mongo':
                return new engine_1.EngineMongo(options.databaseUrl);
            case 'postgresql':
                return new engine_1.EnginePostgres(options.databaseUrl);
        }
        throw new Error("Invalid engine: " + splits[0] + ".");
    }, ['MachinomyOptions']);
    serviceRegistry.bind('ChannelsDatabase', function (engine, channelContract, namespace) {
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
    serviceRegistry.bind('PaymentsDatabase', function (engine, namespace) {
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
    serviceRegistry.bind('TokensDatabase', function (engine, namespace) {
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
    serviceRegistry.bind('PaymentManager', function (chainManager, channelContract, options) { return new payment_manager_1.default(chainManager, channelContract, options); }, ['ChainManager', 'ChannelContract', 'MachinomyOptions']);
    return serviceRegistry;
}
exports.default = defaultRegistry;
//# sourceMappingURL=services.js.map