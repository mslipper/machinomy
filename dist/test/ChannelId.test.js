"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ChannelId_1 = require("../lib/ChannelId");
const expect = require("expect");
const HEX_ADDRESS = 'eb61859a9d74f95bda8a6f9d3efcfe6478e49151';
describe('ChannelId', () => {
    describe('.build', () => {
        const buffer = Buffer.from(HEX_ADDRESS, 'hex');
        const expected = new ChannelId_1.default(buffer);
        it('from non-prefixed hex', () => {
            let channelId = ChannelId_1.default.build(HEX_ADDRESS);
            expect(channelId).toEqual(expected);
        });
        it('from prefixed hex', () => {
            let channelId = ChannelId_1.default.build('0x' + HEX_ADDRESS);
            expect(channelId).toEqual(expected);
        });
        it('from Buffer', () => {
            let channelId = ChannelId_1.default.build(buffer);
            expect(channelId).toEqual(expected);
        });
        it('from ChannelId', () => {
            let channelId = ChannelId_1.default.build(expected);
            expect(channelId).toEqual(expected);
        });
    });
    describe('#toString', () => {
        it('return prefixed hex', () => {
            let channelId = ChannelId_1.default.build(HEX_ADDRESS);
            let actual = channelId.toString();
            expect(actual).toEqual('0x' + HEX_ADDRESS);
        });
    });
});
//# sourceMappingURL=ChannelId.test.js.map