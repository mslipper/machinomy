"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let fetch;
if (typeof global.fetch === 'undefined') {
    const fetchPonyfill = require('fetch-ponyfill');
    fetch = fetchPonyfill().fetch;
}
else {
    fetch = global.fetch;
}
exports.fetcher = {
    fetch(...args) {
        return fetch(...args);
    }
};
exports.default = exports.fetcher;
//# sourceMappingURL=fetch.js.map