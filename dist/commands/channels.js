"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var configuration = require("../lib/configuration");
var index_1 = require("../index");
var Web3 = require("web3");
var payment_channel_1 = require("../lib/payment_channel");
function channels() {
    var settings = configuration.sender();
    var provider = configuration.currentProvider();
    var web3 = new Web3(provider);
    if (!settings.account) {
        return;
    }
    var machinomy = new index_1.default(settings.account, web3, settings);
    machinomy.channels().then(function (channels) { return console.log(channels.map(payment_channel_1.PaymentChannelSerde.instance.serialize)); })
        .catch(function (e) { return console.log(e); })
        .then(function () { return machinomy.shutdown(); })
        .catch(function (e) {
        console.error('Failed to cleanly shut down:');
        console.error(e);
        process.exit(1);
    });
}
exports.default = channels;
//# sourceMappingURL=channels.js.map