import fetch from 'node-fetch';

export default class Api {
  constructor(serverUrl = 'http://localhost', serverPort = '4000') {
    this._url = serverUrl;
    this._port = serverPort;
  }

  request(route, method, url = this._url, port = this._port, body = {}) {
    return new Promise(async (resolve, reject) => {
      let result;
      if (method === 'GET') {
        result = await fetch(`${url}:${port}/${route}`, { method });
      } else {
        result = await fetch(`${url}:${port}/${route}`, { method, body });
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

  // if this chain is not active, the server will throw an error
  getChain(id) {
    return this.request(`chain/${id}`, 'GET');
  }

  deleteChain(id) {
    return this.request(`chain/${id}`, 'DELETE');
  }

  downloadSnapshot(id) {
    return this.request(`snapshot/${id}`, 'GET');
  }

  getBlockNumber(url, port) {
    return this.request(
      '',
      'POST',
      url,
      port,
      '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
    );
  }

  mineBlock(url, port) {
    return this.request(
      '',
      'POST',
      url,
      port,
      '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}'
    );
  }
}
