"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var configuration = require("../lib/configuration");
var Web3 = require("web3");
var index_1 = require("../index");
var pry = function (uri) {
    var settings = configuration.sender();
    var provider = configuration.currentProvider();
    var web3 = new Web3(provider);
    if (!settings.account) {
        return;
    }
    var machinomy = new index_1.default(settings.account, web3, settings);
    machinomy.pry(uri).then(function (res) { return console.log(res); })
        .catch(function (e) { return console.error(e); })
        .then(function () { return machinomy.shutdown(); })
        .catch(function (e) {
        console.error('Failed to cleanly shut down:');
        console.error(e);
        process.exit(1);
    });
};
exports.default = pry;
//# sourceMappingURL=pry.js.map