"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const homedir = require("homedir");
const log_1 = require("./util/log");
const path = require("path");
const Web3 = require("web3");
const env = require("./env");
const BASE_DIR = '.machinomy';
const COFNGIRATION_FILE = 'config.json';
const DATABASE_FILE = 'storage.db';
exports.VERSION = '0.0.3';
exports.PROTOCOL = 'machinomy/' + exports.VERSION;
exports.PAYWALL_PATH = 'api/paywall/' + exports.PROTOCOL;
const log = log_1.default('configuration');
const CONTRACTS = {
    development: '0xede26550428812f833ad7a8d1a9019561d243d6c',
    ropsten: '0xc582877dec917b21fa6b0dc68101b5c01f966325'
};
exports.contractAddress = () => {
    const container = env.container();
    const network = container.MACHINOMY_NETWORK || 'ropsten';
    const address = container.CONTRACT_ADDRESS;
    if (address) {
        return address;
    }
    else {
        return CONTRACTS[network];
    }
};
exports.baseDirPath = () => {
    return path.resolve(path.join(homedir(), BASE_DIR));
};
exports.configFilePath = () => {
    return path.join(exports.baseDirPath(), COFNGIRATION_FILE);
};
const databaseFilePath = () => {
    return path.join(exports.baseDirPath(), DATABASE_FILE);
};
class Configuration {
    constructor(options) {
        this.account = options.account;
        this.password = options.password;
        this.databaseUrl = options.databaseUrl || databaseFilePath();
        this.path = exports.configFilePath();
    }
}
exports.Configuration = Configuration;
/**
 * @returns {object}
 */
exports.configurationOptions = () => {
    try {
        const fs = require('fs');
        return JSON.parse(fs.readFileSync(exports.configFilePath(), 'utf8'));
    }
    catch (error) {
        log(error);
        return {};
    }
};
exports.sender = () => {
    try {
        const options = exports.configurationOptions();
        return new Configuration({
            account: process.env.MACHINOMY_SENDER_ACCOUNT || options.sender.account,
            password: process.env.MACHINOMY_SENDER_PASSWORD || options.sender.password,
            engine: process.env.MACHINOMY_DATABASE_URL || options.sender.databaseUrl
        });
    }
    catch (error) {
        return new Configuration({});
    }
};
exports.receiver = () => {
    try {
        const options = exports.configurationOptions();
        return new Configuration({
            account: process.env.MACHINOMY_RECEIVER_ACCOUNT || options.receiver.account,
            password: process.env.MACHINOMY_RECEIVER_PASSWORD || options.receiver.password,
            engine: process.env.MACHINOMY_DATABASE_URL || options.receiver.databaseUrl
        });
    }
    catch (error) {
        log(error);
        return new Configuration({});
    }
};
function currentProvider() {
    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        return web3.currentProvider;
    }
    else {
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        return new Web3.providers.HttpProvider(process.env.MACHINOMY_GETH_ADDR || 'http://localhost:8545');
    }
}
exports.currentProvider = currentProvider;
//# sourceMappingURL=configuration.js.map