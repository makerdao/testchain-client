import ChainObject from './ChainObject';
import { listAllChains } from './ChainRequest';

export default class ChainManager {
  constructor(socket) {
    this._socket = socket;
    this._chains = {};
    this._connected = false;
  }

  init() {
    return new Promise(async (resolve, reject) => {
      const { list } = await listAllChains();

      list.forEach(async chainData => {
        const { id } = chainData;
        this._chains[id] = new ChainObject(id, this._socket);
        await this.chain(id).init();
      });

      this._connected = true;
      resolve();
    });
  }

  createChain(config) {
    return new Promise(async resolve => {
      const { id, ...info } = await this._socket.push('api', 'start', config);
      this._chains[id] = new ChainObject(id, this._socket);
      await this.chain(id).init(info);
      resolve(id);
    });
  }

  chain(id) {
    if (!!this._chains[id]) return this._chains[id];
    throw new Error('ChainError: No chain exists');
  }

  removeChain(id) {
    this.chain(id).delete(() => {
      delete this._chains[id];
    });
  }

  connected() {
    return this._connected;
  }
}
