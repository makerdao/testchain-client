import SocketService from './SocketService';

export default class Chain {
  constructor() {
    delegate(this, {
      socket: ['connect', 'disconnect', 'socket', 'connected', 'url']
    });
  }

  initialize() {
    this.service('socket').connect();
  }

  service(name) {
    return serviceList[name];
  }
}

function delegate(chain, services) {
  for (const serviceName in services) {
    for (const methodName of services[serviceName]) {
      chain[methodName] = (...args) =>
        chain.service(serviceName)[methodName](...args);
    }
  }
}

const serviceList = {
  socket: new SocketService()
};
