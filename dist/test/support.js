"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tmp = require("tmp");
const BigNumber = require("bignumber.js");
function tmpFileName() {
    return new Promise((resolve, reject) => {
        tmp.tmpName((err, path) => {
            err ? reject(err) : resolve(path);
        });
    });
}
exports.tmpFileName = tmpFileName;
function randomInteger() {
    return Math.floor(Math.random() * 10000);
}
exports.randomInteger = randomInteger;
function randomBigNumber() {
    return new BigNumber.BigNumber(Math.floor(Math.random() * 10000));
}
exports.randomBigNumber = randomBigNumber;
//# sourceMappingURL=support.js.map