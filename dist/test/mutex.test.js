"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mutex_1 = require("../lib/util/mutex");
const expect = require('expect');
describe('Mutex', () => {
    let mutex;
    beforeEach(() => {
        mutex = new mutex_1.default();
    });
    function wait(time) {
        return new Promise((resolve) => setTimeout(() => resolve(time), time));
    }
    // use setImmediate to mimic an async operation calling the method
    function now(task) {
        return new Promise((resolve) => setImmediate(() => task().then(resolve)));
    }
    it('should process tasks in order', () => {
        const outs = [];
        return Promise.all([
            now(() => mutex.synchronize(() => wait(2)).then((num) => outs.push(num))),
            now(() => mutex.synchronize(() => wait(7)).then((num) => outs.push(num))),
            now(() => mutex.synchronize(() => wait(3)).then((num) => outs.push(num)))
        ]).then(() => expect(outs).toEqual([2, 7, 3]));
    });
    it('should process tasks in order by queue name', () => {
        const outs = [];
        return Promise.all([
            now(() => mutex.synchronizeOn('honk', () => wait(2)).then((num) => outs.push(num))),
            now(() => mutex.synchronizeOn('beep', () => wait(7)).then((num) => outs.push(num))),
            now(() => mutex.synchronizeOn('honk', () => wait(3)).then((num) => outs.push(num)))
        ]).then(() => expect(outs).toEqual([2, 3, 7]));
    });
});
//# sourceMappingURL=mutex.test.js.map