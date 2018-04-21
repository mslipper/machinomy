"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("./util/log");
const REG_LOG = log_1.default('Registry');
const CONT_LOG = log_1.default('Container');
class Registry {
    constructor(otherRegistry) {
        this.registry = undefined;
        this.clear();
        if (otherRegistry) {
            const otherServices = otherRegistry.services();
            otherServices.forEach((name) => (this.registry[name] = otherRegistry.get(name)));
        }
    }
    clear() {
        this.registry = {};
    }
    bind(name, factory, dependencies = [], isSingleton = true) {
        REG_LOG(`Registering service ${name}.`);
        if (this.registry[name]) {
            throw new Error(`A service named ${name} is already defined.`);
        }
        this.registry[name] = {
            name,
            factory,
            dependencies,
            isSingleton
        };
    }
    get(name) {
        const service = this.registry[name];
        if (!service) {
            throw new Error(`Service with name ${name} not found`);
        }
        return service;
    }
    services() {
        return Object.keys(this.registry);
    }
}
exports.Registry = Registry;
class Container {
    constructor(registry) {
        this.cache = undefined;
        this.registry = registry;
        this.clear();
    }
    resolve(name) {
        return this.internalResolve(name, []);
    }
    clear() {
        this.cache = {};
    }
    internalResolve(name, visited) {
        CONT_LOG(`Resolving service ${name}.`);
        if (visited[0] === name || visited[visited.length - 1] === name) {
            throw new Error(`Found cyclic dependencies: [${visited.join(',')},${name}]`);
        }
        const definition = this.registry.get(name);
        if (!definition.isSingleton) {
            CONT_LOG(`Instantiating non-singleton service ${name}.`);
            return this.instantiate(definition, visited);
        }
        if (this.cache[name]) {
            CONT_LOG(`Returning cached singleton service ${name}.`);
            return this.cache[name];
        }
        CONT_LOG(`Instantiating singleton service ${name}.`);
        const instance = this.instantiate(definition, visited);
        this.cache[name] = instance;
        return instance;
    }
    instantiate(definition, visited) {
        visited.push(definition.name);
        const dependencies = definition.dependencies.map((dep) => this.internalResolve(dep, visited.slice()));
        const instance = definition.factory.apply(null, dependencies);
        return instance;
    }
}
exports.Container = Container;
//# sourceMappingURL=container.js.map