"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function pify(fn) {
    return new Promise((resolve, reject) => {
        const handler = (err, res) => {
            if (err) {
                return reject(err);
            }
            return resolve(res);
        };
        fn(handler);
    });
}
exports.default = pify;
//# sourceMappingURL=pify.js.map