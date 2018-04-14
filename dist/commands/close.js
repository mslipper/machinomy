"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration = require("../lib/configuration");
const index_1 = require("../index");
const Web3 = require("web3");
let provider = configuration.currentProvider();
let web3 = new Web3(provider);
function close(channelId, options) {
    let namespace = options.namespace || 'sender';
    let settings = configuration.sender();
    if (namespace === 'receiver') {
        settings = configuration.receiver();
    }
    let password = settings.password;
    if (options.parent && options.parent.password) {
        password = options.parent.password;
    }
    if (web3.personal && settings.account) {
        web3.personal.unlockAccount(settings.account, password, 1000);
    }
    if (settings.account) {
        let account = settings.account;
        let machinomy = new index_1.default(account, web3, { databaseUrl: settings.databaseUrl });
        machinomy.close(channelId).then(() => {
            console.log('closed');
        }).catch((e) => {
            console.log(e);
        }).then(() => {
            return machinomy.shutdown();
        }).catch((e) => {
            console.error('Failed to cleanly shut down:');
            console.error(e);
            process.exit(1);
        });
    }
}
exports.default = close;
//# sourceMappingURL=close.js.map