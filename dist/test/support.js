"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tmp = require("tmp");
var BigNumber = require("bignumber.js");
var channel = require('../lib/channel');
function tmpFileName() {
    return new Promise(function (resolve, reject) {
        tmp.tmpName(function (err, path) {
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
function randomChannelId() {
    return channel.id(Buffer.from(randomInteger().toString()));
}
exports.randomChannelId = randomChannelId;
//# sourceMappingURL=support.js.map