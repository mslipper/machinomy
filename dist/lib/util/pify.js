"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function pify(fn) {
    return new Promise(function (resolve, reject) {
        var handler = function (err, res) {
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