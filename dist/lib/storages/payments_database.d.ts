import { ChannelId } from '../channel';
import Payment, { PaymentJSON } from '../payment';
import Engine, { EngineMongo, EngineNedb, EnginePostgres } from '../engines/engine';
export default interface PaymentsDatabase {
    save(token: string, payment: Payment): Promise<void>;
    firstMaximum(channelId: ChannelId | string): Promise<Payment | null>;
    findByToken(token: string): Promise<Payment | null>;
}
export declare abstract class AbstractPaymentsDatabase<T extends Engine> implements PaymentsDatabase {
    kind: string;
    engine: T;
    constructor(engine: T, namespace: string | null);
    inflatePayment(json: PaymentJSON): Payment | null;
    abstract save(token: string, payment: Payment): Promise<void>;
    abstract firstMaximum(channelId: ChannelId | string): Promise<Payment | any>;
    abstract findByToken(token: string): Promise<Payment | any>;
}
/**
 * Database layer for payments.
 */
export declare class MongoPaymentsDatabase extends AbstractPaymentsDatabase<EngineMongo> {
    /**
     * Save payment to the database, to check later.
     */
    save(token: string, payment: Payment): Promise<void>;
    /**
     * Find a payment with maximum value on it inside the channel.
     */
    firstMaximum(channelId: ChannelId | string): Promise<Payment | null>;
    /**
     * Find a payment by token.
     */
    findByToken(token: string): Promise<Payment | null>;
}
export declare class NedbPaymentsDatabase extends AbstractPaymentsDatabase<EngineNedb> {
    save(token: string, payment: Payment): Promise<void>;
    /**
     * Find a payment with maximum value on it inside the channel.
     */
    firstMaximum(channelId: ChannelId | string): Promise<Payment | null>;
    /**
     * Find a payment by token.
     */
    findByToken(token: string): Promise<Payment | null>;
}
export declare class PostgresPaymentsDatabase extends AbstractPaymentsDatabase<EnginePostgres> {
    save(token: string, payment: Payment): Promise<void>;
    firstMaximum(channelId: ChannelId | string): Promise<Payment | any>;
    findByToken(token: string): Promise<Payment | any>;
}
