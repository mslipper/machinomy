"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util = require("ethereumjs-util");
var Signature = /** @class */ (function () {
    function Signature(rpcSig) {
        this.rpcSig = rpcSig;
    }
    Signature.fromRpcSig = function (rpcSig) {
        return new Signature(rpcSig);
    };
    Signature.fromParts = function (parts) {
        var serialized = util.toRpcSig(parts.v, util.toBuffer(parts.r), util.toBuffer(parts.s));
        return new Signature(serialized);
    };
    Signature.prototype.toString = function () {
        return this.rpcSig;
    };
    Signature.prototype.toParts = function () {
        var parts = util.fromRpcSig(this.rpcSig);
        return {
            v: parts.v,
            r: "0x" + parts.r.toString('hex'),
            s: "0x" + parts.s.toString('hex')
        };
    };
    Signature.prototype.isEqual = function (other) {
        return this.toString() === other.toString();
    };
    return Signature;
}());
exports.default = Signature;
//# sourceMappingURL=signature.js.map