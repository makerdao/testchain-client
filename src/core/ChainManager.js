export default class ChainManager {
  constructor(apiService) {
    this._api = apiService;
    this._chains = {};
    this._connected = false;
  }

  init() {
    return new Promise(async (resolve, reject) => {
      const chainsList = await this.requestAllChains();
      this._connected = true;
    });
  }

  requestAllChains() {
    return this._api.request(`/chains/`);
  }

  requestChain(id) {
    return this._api.request(`/chain/${id}`);
  }

  removeChain(id) {
    return this._api.request(`/chain/${id}`, 'DELETE');
  }

  connected() {
    return this._connected;
  }

  createChain(config) {
    return this._api.pushAsync('start', config);
  }
}
