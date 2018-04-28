import * as BigNumber from 'bignumber.js';
import Serde from './serde';
import Signature from './signature';
export interface PaymentJSON {
    channelId: string;
    sender: string;
    receiver: string;
    price: BigNumber.BigNumber;
    value: BigNumber.BigNumber;
    channelValue: BigNumber.BigNumber;
    v: number | string;
    r: string;
    s: string;
    meta: string;
    contractAddress?: string;
    token: string | undefined;
    createdAt?: number;
}
export default class Payment {
    channelId: string;
    sender: string;
    receiver: string;
    price: BigNumber.BigNumber;
    value: BigNumber.BigNumber;
    channelValue: BigNumber.BigNumber;
    signature: Signature;
    meta: string;
    contractAddress: string | undefined;
    token: string | undefined;
    createdAt?: number;
    constructor(options: Payment);
}
export declare class PaymentSerde implements Serde<Payment> {
    static instance: PaymentSerde;
    static required: string[];
    serialize(obj: Payment): object;
    deserialize(data: any): Payment;
}
