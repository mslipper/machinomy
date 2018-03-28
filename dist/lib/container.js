"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var log_1 = require("./util/log");
var REG_LOG = log_1.default('Registry');
var CONT_LOG = log_1.default('Container');
var Registry = /** @class */ (function () {
    function Registry(otherRegistry) {
        var _this = this;
        this.clear();
        if (otherRegistry) {
            var otherServices = otherRegistry.services();
            otherServices.forEach(function (name) { return (_this.registry[name] = otherRegistry.get(name)); });
        }
    }
    Registry.prototype.clear = function () {
        this.registry = {};
    };
    Registry.prototype.bind = function (name, factory, dependencies, isSingleton) {
        if (dependencies === void 0) { dependencies = []; }
        if (isSingleton === void 0) { isSingleton = true; }
        REG_LOG("Registering service " + name + ".");
        if (this.registry[name]) {
            throw new Error("A service named " + name + " is already defined.");
        }
        this.registry[name] = {
            name: name,
            factory: factory,
            dependencies: dependencies,
            isSingleton: isSingleton
        };
    };
    Registry.prototype.get = function (name) {
        var service = this.registry[name];
        if (!service) {
            throw new Error("Service with name " + name + " not found");
        }
        return service;
    };
    Registry.prototype.services = function () {
        return Object.keys(this.registry);
    };
    return Registry;
}());
exports.Registry = Registry;
var Container = /** @class */ (function () {
    function Container(registry) {
        this.registry = registry;
        this.clear();
    }
    Container.prototype.resolve = function (name) {
        return this.internalResolve(name, []);
    };
    Container.prototype.clear = function () {
        this.cache = {};
    };
    Container.prototype.internalResolve = function (name, visited) {
        CONT_LOG("Resolving service " + name + ".");
        if (visited[0] === name || visited[visited.length - 1] === name) {
            throw new Error("Found cyclic dependencies: [" + visited.join(',') + "," + name + "]");
        }
        var definition = this.registry.get(name);
        if (!definition.isSingleton) {
            CONT_LOG("Instantiating non-singleton service " + name + ".");
            return this.instantiate(definition, visited);
        }
        if (this.cache[name]) {
            CONT_LOG("Returning cached singleton service " + name + ".");
            return this.cache[name];
        }
        CONT_LOG("Instantiating singleton service " + name + ".");
        var instance = this.instantiate(definition, visited);
        this.cache[name] = instance;
        return instance;
    };
    Container.prototype.instantiate = function (definition, visited) {
        var _this = this;
        visited.push(definition.name);
        var dependencies = definition.dependencies.map(function (dep) { return _this.internalResolve(dep, visited.slice()); });
        var instance = definition.factory.apply(null, dependencies);
        return instance;
    };
    return Container;
}());
exports.Container = Container;
//# sourceMappingURL=container.js.map