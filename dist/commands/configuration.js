"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const conf = require("../lib/configuration");
function configuration(options) {
    let namespace = options.namespace || 'sender';
    let configuration = conf.sender();
    if (namespace === 'receiver') {
        configuration = conf.receiver();
    }
    console.log(configuration);
}
exports.default = configuration;
//# sourceMappingURL=configuration.js.map