"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expect = require('expect');
function expectsRejection(res) {
    return res.then(() => {
        throw new Error('errExpected');
    }).catch((e) => {
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