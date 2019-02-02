import ChainObject from './ChainObject.js';

export default class ChainManager {
  constructor(apiService) {
    this._api = apiService;
    this._chains = {};
  }

  init() {
    return new Promise(async (resolve, reject) => {
      const { list } = await this.requestAllChains();

      list.forEach(async chainData => {
        const { id } = chainData;
        this._chains[id] = new ChainObject(id, this._api);
        await this.chain(id).init([chainData]);
      });

      resolve();
    });
  }

  createChain(config) {
    return new Promise(async resolve => {
      const { id } = await this._api.pushAsync('start', config);
      this._chains[id] = new ChainObject(id, this._api);

      const { list } = await this.requestAllChains();
      const msg = await this.chain(id).init(list);
      resolve(id);
    });
  }

  requestAllChains() {
    return this._api.request(`/chains/`);
  }

  requestChain(id) {
    return this.chain(id).get();
  }

  chain(id) {
    if (!!this._chains[id]) return this._chains[id];
    throw new Error('ChainError: No chain exists');
  }

  connected(id) {}

  removeChain(id) {
    this.chain(id).delete(() => {
      delete this._chains[id];
    });
  }

  async clean() {
    for (const chain of this._chains) {
      const id = chain.id;
      if (this.chain(id).active()) {
        await this.chain(id).stop();
      } else {
        await this.chain(id).delete();
      }
    }
  }
}
