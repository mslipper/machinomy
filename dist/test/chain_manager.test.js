"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sinon = require("sinon");
var chain_manager_1 = require("../lib/chain_manager");
var signature_1 = require("../lib/signature");
var expect = require('expect');
describe('ChainManager', function () {
    var SIGNATURE = '0xd8a923b39ae82bb39d3b64d58f06e1d776bcbcae34e5b4a6f4a952e8892e6a5b4c0f88833c06fe91729057035161e599fda536e8ce0ab4be2c214d6ea961e93a01';
    var web3;
    var manager;
    beforeEach(function () {
        web3 = {};
        manager = new chain_manager_1.default(web3);
    });
    describe('sign', function () {
        it('should sign the data with the address\'s private key', function () {
            web3.eth = {
                sign: sinon.stub().withArgs('0xaddr', 'some data', sinon.match.func).callsFake(function (addr, data, cb) {
                    cb(null, SIGNATURE);
                })
            };
            return manager.sign('0xaddr', 'some data')
                .then(function (sig) { return expect(sig.isEqual(new signature_1.default(SIGNATURE))).toBe(true); });
        });
    });
});
//# sourceMappingURL=chain_manager.test.js.map