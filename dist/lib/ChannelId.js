"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid");
const safe_buffer_1 = require("safe-buffer");
class ChannelId {
    constructor(buffer) {
        this.id = buffer;
    }
    static random() {
        let id = uuid.v4().replace(/-/g, '');
        return this.build(id);
    }
    static build(something) {
        if (typeof something === 'string') {
            const noPrefix = something.replace('0x', '');
            const buffer = safe_buffer_1.Buffer.from(noPrefix, 'HEX');
            return new ChannelId(buffer);
        }
        else if (something instanceof safe_buffer_1.Buffer) {
            return new ChannelId(something);
        }
        else if (something instanceof ChannelId) {
            return something;
        }
        else {
            throw new Error(`Can not transform ${something} to ChannelId`);
        }
    }
    toString() {
        return '0x' + this.id.toString('hex');
    }
}
exports.default = ChannelId;
//# sourceMappingURL=ChannelId.js.map