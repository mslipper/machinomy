import Web3 = require('web3');
export declare const VERSION = "0.0.3";
export declare const PROTOCOL: string;
export declare const PAYWALL_PATH: string;
export declare const contractAddress: () => string;
export declare const baseDirPath: () => string;
export declare const configFilePath: () => string;
export interface IConfigurationOptions {
    account?: string;
    password?: string;
    engine?: string;
    databaseUrl?: string;
}
export declare class Configuration {
    account?: string;
    password?: string;
    databaseUrl: string;
    path: string;
    constructor(options: IConfigurationOptions);
}
/**
 * @returns {object}
 */
export declare const configurationOptions: () => any;
export declare const sender: () => Configuration;
export declare const receiver: () => Configuration;
export declare function currentProvider(): Web3.Provider;
