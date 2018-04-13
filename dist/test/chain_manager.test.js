"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chain_manager_1 = require("../lib/chain_manager");
const signature_1 = require("../lib/signature");
const expect = require('expect');
describe('ChainManager', () => {
    const SIGNATURE = '0xd8a923b39ae82bb39d3b64d58f06e1d776bcbcae34e5b4a6f4a952e8892e6a5b4c0f88833c06fe91729057035161e599fda536e8ce0ab4be2c214d6ea961e93a01';
    let web3;
    let manager;
    beforeEach(() => {
        web3 = {};
        manager = new chain_manager_1.default(web3);
    });
    describe('sign', () => {
        it('should sign the data with the address\'s private key', () => {
            web3.eth = {
                sign: sinon.stub().withArgs('0xaddr', 'some data', sinon.match.func).callsFake((addr, data, cb) => {
                    cb(null, SIGNATURE);
                })
            };
            return manager.sign('0xaddr', 'some data')
                .then((sig) => expect(sig.isEqual(new signature_1.default(SIGNATURE))).toBe(true));
        });
    });
});
//# sourceMappingURL=chain_manager.test.js.map