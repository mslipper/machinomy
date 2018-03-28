"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var expect = require('expect');
function expectsRejection(res) {
    return res.then(function () {
        throw new Error('errExpected');
    }).catch(function (e) {
        if (e instanceof TypeError) {
            console.error(e);
            throw new Error('Shouldn\'t receive a TypeError.');
        }
        if (e === 'errExpected') {
            throw new Error('An error was expected.');
        }
        expect(e instanceof Error).toBe(true);
    });
}
exports.default = expectsRejection;
//# sourceMappingURL=expects_rejection.js.map