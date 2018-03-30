"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var configuration = require("../lib/configuration");
var index_1 = require("../index");
var Web3 = require("web3");
var provider = configuration.currentProvider();
var web3 = new Web3(provider);
function close(channelId, options) {
    var namespace = options.namespace || 'sender';
    var settings = configuration.sender();
    if (namespace === 'receiver') {
        settings = configuration.receiver();
    }
    var password = settings.password;
    if (options.parent && options.parent.password) {
        password = options.parent.password;
    }
    if (web3.personal && settings.account) {
        web3.personal.unlockAccount(settings.account, password, 1000);
    }
    if (settings.account) {
        var account = settings.account;
        var machinomy_1 = new index_1.default(account, web3, { databaseUrl: settings.databaseUrl });
        machinomy_1.close(channelId).then(function () {
            console.log('closed');
        }).catch(function (e) {
            console.log(e);
        }).then(function () {
            return machinomy_1.shutdown();
        }).catch(function (e) {
            console.error('Failed to cleanly shut down:');
            console.error(e);
            process.exit(1);
        });
    }
}
exports.default = close;
//# sourceMappingURL=close.js.map