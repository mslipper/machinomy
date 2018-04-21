"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buy_1 = require("../lib/buy");
const configuration = require("../lib/configuration");
function buy(uri, command) {
    let settings = configuration.sender();
    let password = settings.password || '';
    if (command.parent && command.parent.password) {
        password = command.parent.password;
    }
    let startBuy = () => {
        if (!settings.account) {
            console.error('Sender account is not defined');
            return;
        }
        buy_1.buyContent(uri, settings.account, password).then(contents => {
            console.log('Buy result:');
            console.log('Token:', contents.token);
            console.log('Channel ID:', contents.channelId.toString());
        }).catch((error) => {
            console.error(error);
        });
    };
    startBuy();
}
exports.default = buy;
//# sourceMappingURL=buy.js.map