export default class ServiceManager {
  constructor(name, dependencies) {
    this._name = name;
    this._dependencies = dependencies;
    this._injections = {};
    dependencies.forEach(d => (this._injections[d] = null));
  }

  name() {
    return this._name;
  }

  dependencies() {
    return this._dependencies;
  }

  dependency(name) {
    return this._injections[name];
  }

  inject(dependency, service) {
    this._injections[dependency] = service;
    return this;
  }
}
