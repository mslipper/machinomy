import Web3 = require('web3');
import Signature from './signature';
export default class ChainManager {
    private web3;
    constructor(web3: Web3);
    sign(address: string, data: string): Promise<Signature>;
}
