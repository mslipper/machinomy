"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fetch;
if (typeof global.fetch === 'undefined') {
    var fetchPonyfill = require('fetch-ponyfill');
    fetch = fetchPonyfill().fetch;
}
else {
    fetch = global.fetch;
}
exports.fetcher = {
    fetch: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return fetch.apply(void 0, args);
    }
};
exports.default = exports.fetcher;
//# sourceMappingURL=fetch.js.map