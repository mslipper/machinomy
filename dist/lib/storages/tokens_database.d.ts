import Engine, { EngineMongo, EngineNedb, EnginePostgres } from '../engines/engine';
import { ChannelId } from '../channel';
export default interface TokensDatabase {
    save(token: string, channelId: ChannelId | string): Promise<void>;
    isPresent(token: string): Promise<boolean>;
}
export declare abstract class AbstractTokensDatabase<T extends Engine> implements TokensDatabase {
    kind: string;
    engine: T;
    constructor(engine: T, namespace: string | null);
    abstract save(token: string, channelId: ChannelId | string): Promise<void>;
    abstract isPresent(token: string): Promise<boolean>;
}
/**
 * Database layer for tokens.
 */
export declare class MongoTokensDatabase extends AbstractTokensDatabase<EngineMongo> {
    save(token: string, channelId: ChannelId | string): Promise<void>;
    isPresent(token: string): Promise<boolean>;
}
export declare class NedbTokensDatabase extends AbstractTokensDatabase<EngineNedb> {
    save(token: string, channelId: ChannelId | string): Promise<void>;
    isPresent(token: string): Promise<boolean>;
}
export declare class PostgresTokensDatabase extends AbstractTokensDatabase<EnginePostgres> {
    save(token: string, channelId: ChannelId | string): Promise<void>;
    isPresent(token: string): Promise<boolean>;
}
