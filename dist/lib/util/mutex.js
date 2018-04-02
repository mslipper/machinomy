"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Mutex {
    constructor() {
        this.queue = [];
        this.busy = false;
    }
    synchronize(task) {
        return new Promise((resolve, reject) => {
            this.queue.push(() => task().then(resolve).catch(reject));
            if (!this.busy) {
                this.dequeue();
            }
        });
    }
    dequeue() {
        const next = this.queue.shift();
        if (!next) {
            this.busy = false;
            return;
        }
        this.busy = true;
        next().then(() => this.dequeue())
            .catch(() => this.dequeue());
    }
}
exports.default = Mutex;
//# sourceMappingURL=mutex.js.map