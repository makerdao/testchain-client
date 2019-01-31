export default class ServiceManager {
  constructor(name, service, dependencies) {
    this._name = name;
    this._dependencies = dependencies;
    this._injections = {};
    this._service = service;
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

  init() {
    return this._service.connect();
  }

  inject(dependency, service) {
    this._injections[dependency] = service;
    return this;
  }
}
