/// <reference types="node" />
import { PaymentChannelJSON, PaymentChannel } from './payment_channel';
export { PaymentChannelJSON, PaymentChannel };
export declare class ChannelId {
    id: Buffer;
    constructor(buffer: Buffer);
    toString(): string;
}
export declare function id(something: string | Buffer | ChannelId): ChannelId;
