"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration = require("../lib/configuration");
const index_1 = require("../index");
const Web3 = require("web3");
const payment_channel_1 = require("../lib/payment_channel");
function channels() {
    const settings = configuration.sender();
    const provider = configuration.currentProvider();
    const web3 = new Web3(provider);
    if (!settings.account) {
        return;
    }
    const machinomy = new index_1.default(settings.account, web3, settings);
    machinomy.channels().then((channels) => console.log(channels.map(payment_channel_1.PaymentChannelSerde.instance.serialize)))
        .catch((e) => console.log(e))
        .then(() => machinomy.shutdown())
        .catch((e) => {
        console.error('Failed to cleanly shut down:');
        console.error(e);
        process.exit(1);
    });
}
exports.default = channels;
//# sourceMappingURL=channels.js.map