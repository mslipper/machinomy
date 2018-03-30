/// <reference types="node" />
import * as BigNumber from 'bignumber.js';
import { PaymentChannel } from './payment_channel';
import ChannelsDatabase from './storages/channels_database';
import { ChannelId } from './channel';
import { EventEmitter } from 'events';
import { TransactionResult } from 'truffle-contract';
import PaymentsDatabase from './storages/payments_database';
import Payment from './payment';
import TokensDatabase from './storages/tokens_database';
import ChannelContract from './channel_contract';
import PaymentManager from './payment_manager';
import { MachinomyOptions } from '../MachinomyOptions';
import Web3 = require('web3');
/** Default settlement period for a payment channel */
export declare const DEFAULT_SETTLEMENT_PERIOD: number;
export interface ChannelManager extends EventEmitter {
    openChannel(sender: string, receiver: string, amount: BigNumber.BigNumber, minDepositAmount?: BigNumber.BigNumber): Promise<PaymentChannel>;
    closeChannel(channelId: string | ChannelId): Promise<TransactionResult>;
    deposit(channelId: string, value: BigNumber.BigNumber): Promise<TransactionResult>;
    nextPayment(channelId: string | ChannelId, amount: BigNumber.BigNumber, meta: string): Promise<Payment>;
    acceptPayment(payment: Payment): Promise<string>;
    requireOpenChannel(sender: string, receiver: string, amount: BigNumber.BigNumber, minDepositAmount?: BigNumber.BigNumber): Promise<PaymentChannel>;
    channels(): Promise<PaymentChannel[]>;
    openChannels(): Promise<PaymentChannel[]>;
    settlingChannels(): Promise<PaymentChannel[]>;
    channelById(channelId: ChannelId | string): Promise<PaymentChannel | null>;
    verifyToken(token: string): Promise<boolean>;
}
export default ChannelManager;
export declare class ChannelManagerImpl extends EventEmitter implements ChannelManager {
    private account;
    private web3;
    private channelsDao;
    private paymentsDao;
    private tokensDao;
    private channelContract;
    private paymentManager;
    private mutex;
    private machinomyOptions;
    constructor(account: string, web3: Web3, channelsDao: ChannelsDatabase, paymentsDao: PaymentsDatabase, tokensDao: TokensDatabase, channelContract: ChannelContract, paymentManager: PaymentManager, machinomyOptions: MachinomyOptions);
    openChannel(sender: string, receiver: string, amount: BigNumber.BigNumber, minDepositAmount?: BigNumber.BigNumber): Promise<PaymentChannel>;
    closeChannel(channelId: string | ChannelId): Promise<TransactionResult>;
    deposit(channelId: string, value: BigNumber.BigNumber): Promise<TransactionResult>;
    nextPayment(channelId: string | ChannelId, amount: BigNumber.BigNumber, meta: string): Promise<Payment>;
    acceptPayment(payment: Payment): Promise<string>;
    requireOpenChannel(sender: string, receiver: string, amount: BigNumber.BigNumber, minDepositAmount?: BigNumber.BigNumber): Promise<PaymentChannel>;
    channels(): Promise<PaymentChannel[]>;
    openChannels(): Promise<PaymentChannel[]>;
    settlingChannels(): Promise<PaymentChannel[]>;
    channelById(channelId: ChannelId | string): Promise<PaymentChannel | null>;
    verifyToken(token: string): Promise<boolean>;
    private internalOpenChannel(sender, receiver, amount, minDepositAmount?);
    private internalCloseChannel(channelId);
    private settle(channel);
    private claim(channel);
    private buildChannel(sender, receiver, price, settlementPeriod);
    private handleUnknownChannel(channelId);
}
