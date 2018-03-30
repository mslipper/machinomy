"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("../lib/container");
var sinon = require("sinon");
var expect = require("expect");
var lastId = 0;
var InstanceCounter = /** @class */ (function () {
    function InstanceCounter() {
        this.id = ++lastId;
    }
    return InstanceCounter;
}());
describe('IOC container', function () {
    var registry;
    var container;
    beforeEach(function () {
        registry = new container_1.Registry();
        container = new container_1.Container(registry);
    });
    describe('registry', function () {
        it('should have a working copy constructor', function () {
            var serviceA = sinon.stub().returns('A');
            registry.bind('A', serviceA);
            var reg2 = new container_1.Registry(registry);
            expect(reg2.get('A').factory).toBe(serviceA);
        });
    });
    it('should resolve bound services and their dependencies', function () {
        var serviceA = sinon.stub().returns('A');
        var serviceB = sinon.stub().returns('B');
        var serviceC = sinon.stub().returns('C');
        registry.bind('A', serviceA);
        registry.bind('B', serviceB, ['A', 'C']);
        registry.bind('C', serviceC);
        expect(container.resolve('A')).toBe('A');
        expect(container.resolve('B')).toBe('B');
        expect(container.resolve('C')).toBe('C');
        expect(serviceA.called).toBe(true);
        expect(serviceB.calledWith('A', 'C')).toBe(true);
        expect(serviceC.called).toBe(true);
    });
    it('should resolve bound services and their dependencies without explicitly resolving dependencies', function () {
        var serviceA = sinon.stub().returns('A');
        var serviceB = sinon.stub().returns('B');
        var serviceC = sinon.stub().returns('C');
        registry.bind('A', serviceA);
        registry.bind('B', serviceB, ['A']);
        registry.bind('C', serviceC);
        expect(container.resolve('B')).toBe('B');
        expect(serviceA.called).toBe(true);
        expect(serviceB.calledWith('A')).toBe(true);
        expect(serviceC.called).toBe(false);
    });
    it('should resolve dependencies to arbitrary depth', function () {
        var stubs = [];
        for (var i = 0; i < 10; i++) {
            var str = i.toString();
            var deps = i < 9 ? ["" + (i + 1)] : [];
            var stub = sinon.stub().returns(str);
            stubs.push(stub);
            registry.bind(str, stub, deps);
        }
        for (var i = 0; i < 10; i++) {
            var str = i.toString();
            expect(container.resolve(str)).toBe(str);
            if (i < 9) {
                expect(stubs[i].calledWith("" + (i + 1))).toBe(true);
            }
            else {
                expect(stubs[i].called).toBe(true);
            }
        }
    });
    it('should cache singleton instances whether resolved or as dependencies', function () {
        var depStub = sinon.stub();
        registry.bind('A', function () { return new InstanceCounter(); });
        registry.bind('B', depStub, ['A']);
        var firstResolution = container.resolve('A');
        expect(container.resolve('A').id).toBe(firstResolution.id);
        container.resolve('B');
        expect(depStub.lastCall.args[0].id).toBe(firstResolution.id);
    });
    it('should create new instance for non-singleton services', function () {
        registry.bind('A', function () { return new InstanceCounter(); }, [], false);
        var firstResolution = container.resolve('A');
        expect(container.resolve('A').id).toBe(firstResolution.id + 1);
    });
    it('should throw an error when binding duplicate services', function () {
        registry.bind('A', function () { return 'A'; });
        expect(function () {
            registry.bind('A', function () { return 'A'; });
        }).toThrow();
    });
    it('should throw an error when resolving nonexistent services, even in dependencies', function () {
        registry.bind('B', function () { return 'B'; }, ['A']);
        expect(function () {
            container.resolve('A');
        }).toThrow();
        expect(function () {
            container.resolve('B');
        }).toThrow();
    });
    it('should throw an error when cyclic dependencies exist', function () {
        registry.bind('A', function () { return 'A'; }, ['A']);
        registry.bind('B', function () { return 'B'; }, ['C']);
        registry.bind('C', function () { return 'C'; }, ['B']);
        expect(function () {
            container.resolve('A');
        }).toThrow();
        expect(function () {
            container.resolve('B');
        }).toThrow();
        registry.clear();
        container.clear();
        registry.bind('A', function () { return 'A'; }, ['B']);
        registry.bind('B', function () { return 'B'; }, ['C']);
        registry.bind('C', function () { return 'C'; }, ['D']);
        registry.bind('D', function () { return 'D'; }, ['A']);
        expect(function () {
            container.resolve('A');
        }).toThrow();
    });
});
//# sourceMappingURL=container.test.js.map