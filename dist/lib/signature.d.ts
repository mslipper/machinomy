export interface SignatureParts {
    v: number;
    r: string;
    s: string;
}
export default class Signature {
    private rpcSig;
    constructor(rpcSig: string);
    static fromRpcSig(rpcSig: string): Signature;
    static fromParts(parts: SignatureParts): Signature;
    toString(): string;
    toParts(): SignatureParts;
    isEqual(other: Signature): boolean;
}
