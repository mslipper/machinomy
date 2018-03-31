/// <reference types="node" />
import { EventEmitter } from 'events';
import { PaymentRequired, Transport } from './transport';
import Payment from './payment';
import ChannelManager from './channel_manager';
import Serde from './serde';
export declare class AcceptPaymentRequest {
    payment: Payment;
    constructor(payment: Payment);
}
export declare class AcceptPaymentRequestSerde implements Serde<AcceptPaymentRequest> {
    static instance: AcceptPaymentRequestSerde;
    serialize(obj: AcceptPaymentRequest): object;
    deserialize(data: any): AcceptPaymentRequest;
}
export declare class AcceptPaymentResponse {
    token: string;
    constructor(token: string);
}
export declare class AcceptPaymentResponseSerde implements Serde<AcceptPaymentResponse> {
    static instance: AcceptPaymentResponseSerde;
    serialize(obj: AcceptPaymentResponse): object;
    deserialize(data: any): AcceptPaymentResponse;
}
export declare class AcceptTokenRequest {
    token: string;
    constructor(token: string);
}
export declare class AcceptTokenRequestSerde implements Serde<AcceptTokenRequest> {
    static instance: AcceptTokenRequestSerde;
    serialize(obj: AcceptTokenRequest): object;
    deserialize(data: any): AcceptTokenRequest;
}
export declare class AcceptTokenResponse {
    status: boolean;
    constructor(status: boolean);
}
export declare class AcceptTokenResponseSerde implements Serde<AcceptTokenResponse> {
    static instance: AcceptTokenResponseSerde;
    serialize(obj: AcceptTokenResponse): object;
    deserialize(data: any): AcceptTokenResponse;
}
export default interface Client extends EventEmitter {
    doPreflight(uri: string): Promise<PaymentRequired>;
    doPayment(payment: Payment, gateway: string): Promise<AcceptPaymentResponse>;
    acceptPayment(req: AcceptPaymentRequest): Promise<AcceptPaymentResponse>;
    doVerify(token: string, gateway: string): Promise<AcceptTokenResponse>;
    acceptVerify(req: AcceptTokenRequest): Promise<AcceptTokenResponse>;
}
export declare class ClientImpl extends EventEmitter implements Client {
    private static HEADER_PREFIX;
    private static REQUIRED_HEADERS;
    private transport;
    private channelManager;
    constructor(transport: Transport, channelManager: ChannelManager);
    doPreflight(uri: string): Promise<PaymentRequired>;
    doPayment(payment: Payment, gateway: string): Promise<AcceptPaymentResponse>;
    acceptPayment(req: AcceptPaymentRequest): Promise<AcceptPaymentResponse>;
    doVerify(token: string, gateway: string): Promise<AcceptTokenResponse>;
    acceptVerify(req: AcceptTokenRequest): Promise<AcceptTokenResponse>;
    private handlePaymentRequired(res);
}
