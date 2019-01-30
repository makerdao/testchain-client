import ServiceProvider from './core/ServiceProvider.js';

export default class Chain {
  constructor() {
    this._provider = new ServiceProvider();
  }

  initialize() {
    this.service('socket').start();
  }

  service(name) {
    return this._provider.service(name);
  }
}
