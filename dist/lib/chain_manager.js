"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pify_1 = require("./util/pify");
const signature_1 = require("./signature");
class ChainManager {
    constructor(web3) {
        this.web3 = web3;
    }
    async sign(address, data) {
        const sig = await pify_1.default((cb) => this.web3.eth.sign(address, data, cb));
        return new signature_1.default(sig);
    }
}
exports.default = ChainManager;
//# sourceMappingURL=chain_manager.js.map