"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var configuration = require("./configuration");
var Web3 = require("web3");
var index_1 = require("../index");
/**
 * Shortcut for Sender.buy.
 */
function buyContent(uri, account, password) {
    var settings = configuration.sender();
    var web3 = new Web3();
    web3.setProvider(configuration.currentProvider());
    if (web3.personal) {
        // web3.personal.unlockAccount(account, password, UNLOCK_PERIOD) // FIXME
    }
    var client = new index_1.default(account, web3, settings);
    return client.buyUrl(uri).then(function (pair) {
        return client.shutdown().then(function () { return pair; });
    });
}
exports.buyContent = buyContent;
//# sourceMappingURL=buy.js.map