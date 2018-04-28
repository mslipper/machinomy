"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration = require("../lib/configuration");
const Web3 = require("web3");
const index_1 = require("../index");
const pry = (uri) => {
    const settings = configuration.sender();
    const provider = configuration.currentProvider();
    const web3 = new Web3(provider);
    if (!settings.account) {
        return;
    }
    const machinomy = new index_1.default(settings.account, web3, settings);
    machinomy.pry(uri).then((res) => console.log(res))
        .catch((e) => console.error(e))
        .then(() => machinomy.shutdown())
        .catch((e) => {
        console.error('Failed to cleanly shut down:');
        console.error(e);
        process.exit(1);
    });
};
exports.default = pry;
//# sourceMappingURL=pry.js.map