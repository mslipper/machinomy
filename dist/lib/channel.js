"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var payment_channel_1 = require("./payment_channel");
exports.PaymentChannel = payment_channel_1.PaymentChannel;
var ChannelId = /** @class */ (function () {
    function ChannelId(buffer) {
        this.id = buffer;
    }
    ChannelId.prototype.toString = function () {
        return '0x' + this.id.toString('hex');
    };
    return ChannelId;
}());
exports.ChannelId = ChannelId;
function id(something) {
    if (typeof something === 'string') {
        var noPrefix = something.replace('0x', '');
        var buffer = Buffer.from(noPrefix, 'HEX');
        return new ChannelId(buffer);
    }
    else if (something instanceof Buffer) {
        return new ChannelId(something);
    }
    else if (something instanceof ChannelId) {
        return something;
    }
    else {
        throw new Error("Can not transform " + something + " to ChannelId");
    }
}
exports.id = id;
//# sourceMappingURL=channel.js.map