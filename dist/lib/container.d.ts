export interface ServiceDefinition {
    name: string;
    factory: Function;
    dependencies: Array<string>;
    isSingleton: boolean;
}
export declare class Registry {
    private registry;
    constructor(otherRegistry?: Registry);
    clear(): void;
    bind(name: string, factory: Function, dependencies?: Array<string>, isSingleton?: boolean): void;
    get(name: string): ServiceDefinition;
    services(): string[];
}
export declare class Container {
    private registry;
    private cache;
    constructor(registry: Registry);
    resolve<T>(name: string): any;
    clear(): void;
    private internalResolve<T>(name, visited);
    private instantiate<T>(definition, visited);
}
