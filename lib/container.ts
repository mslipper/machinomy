export interface ServiceDefinition {
  name: string,
  factory: Function,
  dependencies: Array<string>,
  isSingleton: boolean
}

export class Container {
  private registry: { [name: string]: ServiceDefinition }

  private cache: { [name: string]: any }

  constructor () {
    this.clear()
  }

  bind (name: string, factory: Function, dependencies: Array<string> = [], isSingleton: boolean = true) {
    if (this.registry[name]) {
      throw new Error(`A service named ${name} is already defined.`)
    }

    this.registry[name] = {
      name,
      factory,
      dependencies,
      isSingleton
    }
  }

  resolve<T> (name: string) {
    return this.internalResolve<T>(name, [])
  }

  clear (): void {
    this.registry = {}
    this.cache = {}
  }

  private internalResolve<T> (name: string, visited: string[]) {
    if (visited[0] === name || visited[visited.length - 1] === name) {
      throw new Error(`Found cyclic dependencies: [${visited.join(',')},${name}]`)
    }

    const definition = this.registry[name]

    if (!definition) {
      throw new Error(`No service with name ${name} found.`)
    }

    if (!definition.isSingleton) {
      return this.instantiate(definition, visited)
    }

    if (this.cache[name]) {
      return this.cache[name]
    }

    const instance = this.instantiate(definition, visited)
    this.cache[name] = instance
    return instance as T
  }

  private instantiate<T> (definition: ServiceDefinition, visited: string[]) {
    visited.push(definition.name)
    const dependencies = definition.dependencies.map(
      (dep: string) => this.internalResolve(dep, visited.slice()))
    const instance = definition.factory.apply(null, dependencies)
    return instance as T
  }
}

export const ServiceContext = new Container()

export default ServiceContext
