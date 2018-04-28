/// <reference types="node" />
import { EventEmitter } from 'events';
import { PaymentRequired, Transport } from './transport';
import Payment from './payment';
import ChannelManager from './channel_manager';
import { AcceptPaymentRequest } from './accept_payment_request';
import { AcceptPaymentResponse } from './accept_payment_response';
import { AcceptTokenRequest } from './accept_token_request';
import { AcceptTokenResponse } from './accept_token_response';
export default interface Client extends EventEmitter {
    doPreflight(uri: string): Promise<PaymentRequired>;
    doPayment(payment: Payment, gateway: string, purchaseMeta?: any): Promise<AcceptPaymentResponse>;
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
    doPayment(payment: Payment, gateway: string, purchaseMeta?: any): Promise<AcceptPaymentResponse>;
    acceptPayment(req: AcceptPaymentRequest): Promise<AcceptPaymentResponse>;
    doVerify(token: string, gateway: string): Promise<AcceptTokenResponse>;
    acceptVerify(req: AcceptTokenRequest): Promise<AcceptTokenResponse>;
    private handlePaymentRequired(res);
}
