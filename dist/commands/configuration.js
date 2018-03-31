"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var conf = require("../lib/configuration");
function configuration(options) {
    var namespace = options.namespace || 'sender';
    var configuration = conf.sender();
    if (namespace === 'receiver') {
        configuration = conf.receiver();
    }
    console.log(configuration);
}
exports.default = configuration;
//# sourceMappingURL=configuration.js.map