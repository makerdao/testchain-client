import Container from './Container';
import uniq from 'lodash.uniq';

import SocketService from '../services/SocketService';
import ApiService from '../services/ApiService';
import ChainManagerService from '../services/ChainManagerService';

const serviceList = {
  socket: SocketService,
  api: ApiService,
  chainMgr: ChainManagerService
};

/**
 *** These are functions which we want to be able call from the dashboard
 **/
const methodsList = {
  socket: ['start', 'connect', 'disconnect', 'socket', 'connected', 'url'],
  api: ['start']
};

export default class ServiceProvider {
  constructor() {
    this._services = serviceList;
    this._container = null;
  }

  buildContainer() {
    const container = new Container();

    let instance;
    for (const service in this._services) {
      instance = new this._services[service]();
      container.register(instance);
    }

    this._registerDependencies(container);
    container.injectDependencies();
    this._container = container;
    return container;
  }

  _registerDependencies(container) {
    const names = container.getRegisteredServiceNames();

    const allDeps = names.reduce((acc, name) => {
      const service = container.service(name);
      const deps = service.manager().dependencies();
      return uniq(acc.concat(deps));
    }, []);

    const newDeps = allDeps.filter(name => !names.includes(name));
    if (newDeps.length === 0) return;

    for (let name of newDeps) {
      const remainer = this._services[name];
      container.register(new remainer());
    }
    this._registerDependencies(container);
  }

  service(name) {
    if (!this._container) this.buildContainer();
    return this._container.service(name);
  }

  // delegateMethodsFromServices(obj, services = methodsList) {
  //   for (const serviceName in services) {
  //     console.log(serviceName);
  //     for (const methodName of services[serviceName]) {
  //       obj[methodName] = (...args) =>
  //         obj.service(serviceName)[methodName](...args);
  //     }
  //   }
  // };
}
