"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Mutex = /** @class */ (function () {
    function Mutex() {
        this.queue = [];
        this.busy = false;
    }
    Mutex.prototype.synchronize = function (task) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.queue.push(function () { return task().then(resolve).catch(reject); });
            if (!_this.busy) {
                _this.dequeue();
            }
        });
    };
    Mutex.prototype.dequeue = function () {
        var _this = this;
        var next = this.queue.shift();
        if (!next) {
            this.busy = false;
            return;
        }
        this.busy = true;
        next().then(function () { return _this.dequeue(); })
            .catch(function () { return _this.dequeue(); });
    };
    return Mutex;
}());
exports.default = Mutex;
//# sourceMappingURL=mutex.js.map