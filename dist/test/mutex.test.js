"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mutex_1 = require("../lib/util/mutex");
var expect = require('expect');
describe('Mutex', function () {
    var mutex;
    beforeEach(function () {
        mutex = new mutex_1.default();
    });
    it('should process tasks in order', function () {
        function wait(time) {
            return new Promise(function (resolve) { return setTimeout(function () { return resolve(time); }, time); });
        }
        // use setImmediate to mimic an async operation calling the method
        function now(task) {
            return new Promise(function (resolve) { return setImmediate(function () { return task().then(resolve); }); });
        }
        var outs = [];
        return Promise.all([
            now(function () { return mutex.synchronize(function () { return wait(2); }).then(function (num) { return outs.push(num); }); }),
            now(function () { return mutex.synchronize(function () { return wait(7); }).then(function (num) { return outs.push(num); }); }),
            now(function () { return mutex.synchronize(function () { return wait(3); }).then(function (num) { return outs.push(num); }); })
        ]).then(function () { return expect(outs).toEqual([2, 7, 3]); });
    });
});
//# sourceMappingURL=mutex.test.js.map