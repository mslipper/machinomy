/// <reference types="node" />
export default class ChannelId {
    id: Buffer;
    constructor(buffer: Buffer);
    static random(): ChannelId;
    static build(something: string | Buffer | ChannelId): ChannelId;
    toString(): string;
}
