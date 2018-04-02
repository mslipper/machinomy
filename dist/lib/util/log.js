"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
function log(namespace) {
    return debug(`machinomy:${namespace}`);
}
exports.default = log;
//# sourceMappingURL=log.js.map