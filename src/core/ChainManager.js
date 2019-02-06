import SocketService from './SocketService.js';
import Api from './Api';
import Chain from './Chain';
import { find } from 'lodash';

export default class ChainManager {
  constructor(api = null) {
    this._socket = new SocketService();
    this._socketUrl = null;
    this._api = api === null ? new Api() : api;
    this._chains = {};
    this._connected = false;
  }

  init(socketUrl = 'ws://127.1:4000/socket') {
    return new Promise(async (resolve, reject) => {
      this._socketUrl = socketUrl;
      await this._socket.init(this._socketUrl);
      const { list } = await this._api.listAllChains();

      list.forEach(async chainData => {
        const { id } = chainData;
        this._chains[id] = new Chain(id, this._socket, this._api);
        await this.chain(id).init();
      });

      this._connected = true;
      resolve();
    });
  }

  createChain(config) {
    return new Promise(async resolve => {
      const { id, ...info } = await this._socket.push('api', 'start', config);
      this._chains[id] = new Chain(id, this._socket, this._api);
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
      const { list } = await this._api.listAllChains();
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
      const { list } = await this._api.listAllChains();
      for (const chain of list) {
        await this.removeChain(chain.id);
      }
      resolve();
    });
  }

  chains() {
    return this._chains;
  }

  connected() {
    return this._connected;
  }
}
