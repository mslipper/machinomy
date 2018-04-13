"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration = require("./configuration");
const Web3 = require("web3");
const index_1 = require("../index");
/**
 * Shortcut for Sender.buy.
 */
function buyContent(uri, account, password) {
    let settings = configuration.sender();
    let web3 = new Web3();
    web3.setProvider(configuration.currentProvider());
    if (web3.personal) {
        // web3.personal.unlockAccount(account, password, UNLOCK_PERIOD) // FIXME
    }
    let client = new index_1.default(account, web3, settings);
    return client.buyUrl(uri).then((pair) => {
        return client.shutdown().then(() => pair);
    });
}
exports.buyContent = buyContent;
//# sourceMappingURL=buy.js.map