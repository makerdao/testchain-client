import fetch from 'node-fetch';

export default class Api {
  constructor(serverUrl) {
    this._url = serverUrl;
  }

  request(route, method, url = this._url, body = {}) {
    return new Promise(async (resolve, reject) => {
      let result;
      if (method === 'GET') {
        result = await fetch(`${url}/${route}`, { method });
      } else {
        result = await fetch(`${url}/${route}`, { method, body });
      }
      const { status, ...data } = await result.json();
      !status ? resolve(data) : reject(data);
    });
  }

  listAllChains() {
    return this.request('chains/', 'GET');
  }

  listAllSnapshots(chainType = 'ganache') {
    return this.request(`snapshots/${chainType}`, 'GET');
  }

  getChain(id) {
    return this.request(`chain/${id}`, 'GET');
  }

  deleteChain(id) {
    return this.request(`chain/${id}`, 'DELETE');
  }

  downloadSnapshot(id) {
    return this.request(`snapshot/${id}`, 'GET');
  }

  async getBlockNumber(url) {
    const { result: blockNumber } = await this.request(
      '',
      'POST',
      url,
      '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
    );
    return parseInt(blockNumber, 16);
  }

  mineBlock(url) {
    return this.request(
      '',
      'POST',
      url,
      '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}'
    );
  }
}
