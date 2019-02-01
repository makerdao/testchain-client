import ChainObject from './ChainObject.js';

export default class ChainManager {
  constructor(apiService) {
    this._api = apiService;
    this._chains = {};
    this._connected = false;
  }

  init() {
    return new Promise(async (resolve, reject) => {
      const { list } = await this.requestAllChains();

      list.forEach(async chainData => {
        const { id } = chainData;
        this._chains[id] = new ChainObject(id, this._api);
        this.chain(id).populate([chainData]);
      });

      this._connected = true;
      resolve();
    });
  }

  async requestAllChains() {
    return this._api.request(`/chains/`);
  }

  chain(id) {
    return this._chains[id];
  }

  async removeChain(id) {
    await this.chain(id).delete();
    delete this._chains[id];
  }

  connected() {
    return this._connected;
  }

  /**
    Have to make an extra request to list all chains as
    `/chain/{id}` only lists a portion of the chain information
  */
  async createChain(config) {
    const { id } = await this._api.pushAsync('start', config);
    this._chains[id] = new ChainObject(id, this._api);

    const { list } = await this.requestAllChains();
    this.chain(id).populate(list);
    return id;
  }
}
