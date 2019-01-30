import SocketService from './SocketService';
import ChannelService from './ChannelService';

export default class Chain {
  constructor() {
    delegate(this, {
      socket: ['start', 'connect', 'disconnect', 'socket', 'connected', 'url'],
      channel: ['start']
    });
  }

  initialize() {
    this.service('socket').start();
    this.service('channel').start(this.socket());
  }

  service(name) {
    return serviceList[name];
  }

  socket() {
    return service('socket');
  }
  channel() {
    return service('channel');
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
  socket: new SocketService(),
  channel: new ChannelService()
};
