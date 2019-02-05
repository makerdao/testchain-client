import SocketService from './SocketService.js';
import Chain from './Chain';
import { find } from 'lodash';
import { listAllChains } from './api';

export default class ChainManager {
  constructor() {
    this._socket = new SocketService();
    this._chains = {};
    this._connected = false;
  }

  init() {
    return new Promise(async (resolve, reject) => {
      await this._socket.init();
      const { list } = await listAllChains();

      list.forEach(async chainData => {
        const { id } = chainData;
        this._chains[id] = new Chain(id, this._socket);
        await this.chain(id).init();
      });

      this._connected = true;
      resolve();
    });
  }

  createChain(config) {
    return new Promise(async resolve => {
      const { id, ...info } = await this._socket.push('api', 'start', config);
      this._chains[id] = new Chain(id, this._socket);
      await this.chain(id).init(info);
      resolve(id);
    });
  }

  chain(id) {
    if (!!this._chains[id]) return this._chains[id];
    throw new Error('ChainError: No chain exists');
  }

  exists(id) {
    return new Promise(async resolve => {
      const { list } = await listAllChains();
      const res = find(list, { id: id });
      resolve(!!res);
    });
  }

  removeChain(id) {
    return this.chain(id).delete(() => {
      delete this._chains[id];
    });
  }

  clean() {
    return new Promise(async resolve => {
      const { list } = await listAllChains();

      for (const chain of list) {
        await this.removeChain(chain.id);
      }
      resolve();
    });
  }

  connected() {
    return this._connected;
  }
}
