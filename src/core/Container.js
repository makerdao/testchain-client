import ServiceManager from './ServiceManager.js';
import values from 'lodash.values';

export default class Container {
  constructor() {
    this._services = {};
  }

  register(service) {
    const name = service.manager().name();
    this._services[name] = service;
    return this;
  }

  getRegisteredServiceNames() {
    return Object.keys(this._services);
  }

  service(name) {
    return this._services[name];
  }

  async init(service) {
    const manager = this._services[service].manager();
    await manager.init();
  }

  injectDependencies() {
    const services = values(this._services);
    for (let service of services) {
      const manager = service.manager();
      for (let name of manager.dependencies()) {
        const dep = this._services[name];
        if (!dep) throw new Error('no dependency: ' + name);
        manager.inject(name, this._services[name]);
      }
    }
  }
}
