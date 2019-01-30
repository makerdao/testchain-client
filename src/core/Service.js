import ServiceManager from './ServiceManager';

export default class Service {
  constructor(name, dependencies = []) {
    this._serviceManager = new ServiceManager(name, dependencies);
  }

  manager() {
    return this._serviceManager;
  }

  get(dependency) {
    return this._serviceManager.dependency(dependency);
  }
}
