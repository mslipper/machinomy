import Payment from './payment';
import * as BigNumber from 'bignumber.js';
import Serde from './serde';
export interface PaymentChannelJSON {
    sender: string;
    receiver: string;
    channelId: string;
    value: BigNumber.BigNumber;
    spent: BigNumber.BigNumber;
    state: number;
    contractAddress: string | undefined;
}
export interface SerializedPaymentChannel {
    state: number;
    spent: string;
    value: string;
    channelId: string;
    receiver: string;
    sender: string;
    contractAddress: string | undefined;
}
/**
 * The Payment Channel
 */
export declare class PaymentChannel {
    sender: string;
    receiver: string;
    channelId: string;
    value: BigNumber.BigNumber;
    spent: BigNumber.BigNumber;
    state: number;
    contractAddress: string | undefined;
    /**
     * @param sender      Ethereum address of the client.
     * @param receiver    Ethereum address of the server.
     * @param channelId   Identifier of the channel.
     * @param value       Total value of the channel.
     * @param spent       Value sent by {sender} to {receiver}.
     * @param state       0 - 'open', 1 - 'settling', 2 - 'settled'
     */
    constructor(sender: string, receiver: string, channelId: string, value: BigNumber.BigNumber, spent: BigNumber.BigNumber, state: number | undefined, contractAddress: string | undefined);
    static fromPayment(payment: Payment): PaymentChannel;
    static fromDocument(document: PaymentChannelJSON): PaymentChannel;
}
export declare class PaymentChannelSerde implements Serde<PaymentChannel> {
    static instance: PaymentChannelSerde;
    serialize(obj: PaymentChannel): SerializedPaymentChannel;
    deserialize(data: any): PaymentChannel;
}
