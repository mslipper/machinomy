"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Mutex {
    constructor() {
        this.queues = {};
        this.busyQueues = {};
    }
    synchronize(task) {
        return this.synchronizeOn(Mutex.DEFAULT_QUEUE, task);
    }
    synchronizeOn(key, task) {
        return new Promise((resolve, reject) => {
            if (!this.queues[key]) {
                this.queues[key] = [];
            }
            this.queues[key].push(() => task().then(resolve).catch(reject));
            if (!this.busyQueues[key]) {
                this.dequeue(key);
            }
        });
    }
    dequeue(queueName) {
        const next = this.queues[queueName].shift();
        if (!next) {
            delete this.busyQueues[queueName];
            delete this.queues[queueName];
            return;
        }
        this.busyQueues[queueName] = true;
        next().then(() => this.dequeue(queueName))
            .catch(() => this.dequeue(queueName));
    }
}
Mutex.DEFAULT_QUEUE = '__MUTEX_DEFAULT_QUEUE';
exports.default = Mutex;
//# sourceMappingURL=mutex.js.map