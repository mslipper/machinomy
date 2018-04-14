"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("ethereumjs-util");
class Signature {
    constructor(rpcSig) {
        this.rpcSig = rpcSig;
    }
    static fromRpcSig(rpcSig) {
        return new Signature(rpcSig);
    }
    static fromParts(parts) {
        const serialized = util.toRpcSig(parts.v, util.toBuffer(parts.r), util.toBuffer(parts.s));
        return new Signature(serialized);
    }
    toString() {
        return this.rpcSig;
    }
    toParts() {
        const parts = util.fromRpcSig(this.rpcSig);
        return {
            v: parts.v,
            r: `0x${parts.r.toString('hex')}`,
            s: `0x${parts.s.toString('hex')}`
        };
    }
    isEqual(other) {
        return this.toString() === other.toString();
    }
}
exports.default = Signature;
//# sourceMappingURL=signature.js.map