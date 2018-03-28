import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import { TransactionResult } from 'truffle-contract';
import Signature from './signature';
export default class ChannelContract {
    private _contract?;
    private web3;
    constructor(web3: Web3);
    private static generateId();
    open(sender: string, receiver: string, price: BigNumber.BigNumber, settlementPeriod: number): Promise<TransactionResult>;
    claim(receiver: string, channelId: string, value: BigNumber.BigNumber, signature: Signature): Promise<TransactionResult>;
    deposit(sender: string, channelId: string, value: BigNumber.BigNumber): Promise<TransactionResult>;
    getState(channelId: string): Promise<number>;
    getSettlementPeriod(channelId: string): Promise<BigNumber.BigNumber>;
    startSettle(account: string, channelId: string): Promise<TransactionResult>;
    finishSettle(account: string, channelId: string): Promise<TransactionResult>;
    paymentDigest(channelId: string, value: BigNumber.BigNumber): Promise<string>;
    canClaim(channelId: string, payment: BigNumber.BigNumber, receiver: string, signature: Signature): Promise<boolean>;
    channelById(channelId: string): Promise<[string, string, BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber]>;
    private contract();
}
