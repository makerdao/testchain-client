import SocketService from './SocketService';
import ApiService from './ApiService';

const serviceList = {
  socket: new SocketService(),
  api: new ApiService()
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
    this._services = {};
    this.buildServices();
  }

  buildServices() {
    let instance;
    for (const service in serviceList) {
      this._services[service] = serviceList[service];
      this.injectGlobalServiceGetter(service);
    }

    /**
       Could trigger start function for all service modules at this point
     */
  }

  service(name) {
    return this._services[name];
  }

  injectGlobalServiceGetter(service) {
    this._services[service]['get'] = name => {
      return this.service(name);
    };
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
