import { PaymentChannel, PaymentChannelJSON } from '../payment_channel';
import ChannelId from '../ChannelId';
import Engine, { EngineMongo, EngineNedb, EnginePostgres } from '../engines/engine';
import * as BigNumber from 'bignumber.js';
import ChannelContract from '../channel_contract';
export default interface ChannelsDatabase {
    save(paymentChannel: PaymentChannel): Promise<void>;
    saveOrUpdate(paymentChannel: PaymentChannel): Promise<void>;
    deposit(channelId: ChannelId | string, value: BigNumber.BigNumber): Promise<void>;
    firstById(channelId: ChannelId | string): Promise<PaymentChannel | null>;
    spend(channelId: ChannelId | string, spent: BigNumber.BigNumber): Promise<void>;
    all(): Promise<Array<PaymentChannel>>;
    allOpen(): Promise<PaymentChannel[]>;
    allSettling(): Promise<PaymentChannel[]>;
    findUsable(sender: string, receiver: string, amount: BigNumber.BigNumber): Promise<PaymentChannel | null>;
    findBySenderReceiver(sender: string, receiver: string): Promise<Array<PaymentChannel>>;
    findBySenderReceiverChannelId(sender: string, receiver: string, channelId: ChannelId | string): Promise<PaymentChannel | null>;
    updateState(channelId: ChannelId | string, state: number): Promise<void>;
}
export declare abstract class AbstractChannelsDatabase<T extends Engine> implements ChannelsDatabase {
    engine: T;
    kind: string;
    contract: ChannelContract;
    constructor(engine: T, channelContract: ChannelContract, namespace: string | null);
    inflatePaymentChannels(channels: Array<PaymentChannelJSON>): Promise<Array<PaymentChannel>>;
    inflatePaymentChannel(json: PaymentChannelJSON): Promise<PaymentChannel | null>;
    filterByState(state: number, channels: PaymentChannel[]): PaymentChannel[];
    abstract save(paymentChannel: PaymentChannel): Promise<void>;
    saveOrUpdate(paymentChannel: PaymentChannel): Promise<void>;
    abstract deposit(channelId: ChannelId | string, value: BigNumber.BigNumber): Promise<void>;
    abstract firstById(channelId: ChannelId | string): Promise<PaymentChannel | null>;
    abstract spend(channelId: ChannelId | string, spent: BigNumber.BigNumber): Promise<void>;
    abstract all(): Promise<Array<PaymentChannel>>;
    abstract allOpen(): Promise<PaymentChannel[]>;
    allSettling(): Promise<PaymentChannel[]>;
    abstract findUsable(sender: string, receiver: string, amount: BigNumber.BigNumber): Promise<PaymentChannel | null>;
    abstract findBySenderReceiver(sender: string, receiver: string): Promise<Array<PaymentChannel>>;
    abstract findBySenderReceiverChannelId(sender: string, receiver: string, channelId: ChannelId | string): Promise<PaymentChannel | null>;
    abstract updateState(channelId: ChannelId | string, state: number): Promise<void>;
}
/**
 * Database layer for {PaymentChannel}
 */
export declare class NedbChannelsDatabase extends AbstractChannelsDatabase<EngineNedb> implements ChannelsDatabase {
    save(paymentChannel: PaymentChannel): Promise<void>;
    firstById(channelId: ChannelId | string): Promise<PaymentChannel | null>;
    /**
     * Set amount of money spent on the channel.
     */
    spend(channelId: ChannelId | string, spent: BigNumber.BigNumber): Promise<void>;
    deposit(channelId: ChannelId | string, value: BigNumber.BigNumber): Promise<void>;
    /**
     * Retrieve all the payment channels stored.
     *
     * @return {Promise<PaymentChannel>}
     */
    all(): Promise<Array<PaymentChannel>>;
    allOpen(): Promise<PaymentChannel[]>;
    findUsable(sender: string, receiver: string, amount: BigNumber.BigNumber): Promise<PaymentChannel | null>;
    findBySenderReceiver(sender: string, receiver: string): Promise<Array<PaymentChannel>>;
    findBySenderReceiverChannelId(sender: string, receiver: string, channelId: ChannelId | string): Promise<PaymentChannel | null>;
    updateState(channelId: ChannelId | string, state: number): Promise<void>;
}
export declare class MongoChannelsDatabase extends AbstractChannelsDatabase<EngineMongo> implements ChannelsDatabase {
    save(paymentChannel: PaymentChannel): Promise<void>;
    firstById(channelId: ChannelId | string): Promise<PaymentChannel | null>;
    /**
     * Set amount of money spent on the channel.
     */
    spend(channelId: ChannelId | string, spent: BigNumber.BigNumber): Promise<void>;
    deposit(channelId: ChannelId | string, value: BigNumber.BigNumber): Promise<void>;
    /**
     * Retrieve all the payment channels stored.
     *
     * @return {Promise<PaymentChannel>}
     */
    all(): Promise<Array<PaymentChannel>>;
    allOpen(): Promise<PaymentChannel[]>;
    findUsable(sender: string, receiver: string, amount: BigNumber.BigNumber): Promise<PaymentChannel | null>;
    findBySenderReceiver(sender: string, receiver: string): Promise<Array<PaymentChannel>>;
    findBySenderReceiverChannelId(sender: string, receiver: string, channelId: ChannelId | string): Promise<PaymentChannel | null>;
    updateState(channelId: ChannelId | string, state: number): Promise<void>;
}
export declare class PostgresChannelsDatabase extends AbstractChannelsDatabase<EnginePostgres> {
    save(paymentChannel: PaymentChannel): Promise<void>;
    firstById(channelId: ChannelId | string): Promise<PaymentChannel | null>;
    spend(channelId: ChannelId | string, spent: BigNumber.BigNumber): Promise<void>;
    deposit(channelId: ChannelId | string, value: BigNumber.BigNumber): Promise<void>;
    all(): Promise<Array<PaymentChannel>>;
    allOpen(): Promise<PaymentChannel[]>;
    findUsable(sender: string, receiver: string, amount: BigNumber.BigNumber): Promise<PaymentChannel | null>;
    findBySenderReceiver(sender: string, receiver: string): Promise<Array<PaymentChannel>>;
    findBySenderReceiverChannelId(sender: string, receiver: string, channelId: ChannelId | string): Promise<PaymentChannel | null>;
    updateState(channelId: ChannelId | string, state: number): Promise<void>;
}
