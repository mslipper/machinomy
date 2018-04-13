/// <reference types="request" />
import { RequestResponse } from 'request';
import Payment from './payment';
import * as BigNumber from 'bignumber.js';
export declare const STATUS_CODES: {
    PAYMENT_REQUIRED: number;
    OK: number;
};
export interface GetWithTokenCallbacks {
    onWillLoad?: Function;
    onDidLoad?: Function;
}
export interface RequestTokenOpts {
    onWillSendPayment?: Function;
    onDidSendPayment?: Function;
}
export declare class Transport {
    /**
     * Request URI sending a paywall token.
     * @return {Promise<object>}
     */
    getWithToken(uri: string, token: string, opts?: GetWithTokenCallbacks): Promise<RequestResponse>;
    get(uri: string, headers?: object): Promise<RequestResponse>;
    /**
     * Request token from the server's gateway
     * @param {string} uri - Full url to the gateway.
     * @param {Payment} payment
     * @param {{uri: string, headers: object, onWillPreflight: function, onDidPreflight: function, onWillOpenChannel: function, onDidOpenChannel: function, onWillSendPayment: function, onDidSendPayment: function, onWillLoad: function, onDidLoad: function}} opts
     * @return {Promise<string>}
     */
    requestToken(uri: string, payment: Payment, opts?: RequestTokenOpts): Promise<string>;
}
export declare class PaymentRequired {
    receiver: string;
    price: BigNumber.BigNumber;
    gateway: string;
    meta: string;
    contractAddress?: string;
    constructor(receiver: string, price: BigNumber.BigNumber, gateway: string, meta: string, contractAddress?: string);
    static parse: (headers: any) => PaymentRequired;
}
/**
 * Build Transport instance.
 */
export declare const build: () => Transport;
