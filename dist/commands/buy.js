"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var buy_1 = require("../lib/buy");
var configuration = require("../lib/configuration");
function buy(uri, command) {
    var settings = configuration.sender();
    var password = settings.password || '';
    if (command.parent && command.parent.password) {
        password = command.parent.password;
    }
    var startBuy = function () {
        if (!settings.account) {
            console.error('Sender account is not defined');
            return;
        }
        buy_1.buyContent(uri, settings.account, password).then(function (contents) {
            console.log('Buy result:');
            console.log('Token:', contents.token);
            console.log('Channel ID:', contents.channelId.toString());
        }).catch(function (error) {
            console.error(error);
        });
    };
    startBuy();
}
exports.default = buy;
//# sourceMappingURL=buy.js.map