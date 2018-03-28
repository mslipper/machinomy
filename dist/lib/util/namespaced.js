"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function namespaced(namespace, kind) {
    var result = kind;
    if (namespace) {
        result = namespace + ':' + kind;
    }
    return result;
}
exports.namespaced = namespaced;
//# sourceMappingURL=namespaced.js.map