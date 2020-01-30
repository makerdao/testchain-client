import fetch from 'node-fetch';

export default class Api {
  constructor(serverUrl) {
    this._url = serverUrl;
    this._email = '';
  }

  setEmail(userEmail) {
    this._email = userEmail;
  }

  request(route, method, url = this._url, body = {}) {
    return new Promise(async (resolve, reject) => {
      let options = {};
      if (this._email) options = { headers: { 'X-User-Email': this._email } };
      if (method === 'GET') {
        options = { ...options, method };
      } else if (method === 'DELETE') {
        options = {
          ...options,
          method,
          body
        };
      } else {
        options = {
          ...options,
          method,
          body,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json'
          }
        };
      }
      try {
        const result = await fetch(`${url}/${route}`, options);
        const { status, ...data } = await result.json();
        !status ? resolve(data) : reject(data);
      } catch (err) {
        reject(err);
      }
    }).catch(err => {
      console.error(err);
      return Promise.reject(err);
    });
  }

  startStack(config) {
    const body = JSON.stringify(config);
    return this.request('/stack/start', 'POST', this._url, body);
  }

  restartStack(id) {
    // TODO: check if something else needed ?
    const config = {
      testchain: {
        config: {
          id: id
        },
        deps: []
      }
    };
    const body = JSON.stringify(config);
    return this.request('stack/start', 'POST', this._url, body);
  }

  stopStack(id) {
    return this.request(`stack/stop/${id}`, 'GET');
  }

  getStackInfo(id) {
    return this.request(`stack/info/${id}`, 'GET');
  }

  getChain(id) {
    return this.request(`chain/${id}`, 'GET');
  }

  listAllChains() {
    return this.request('chains', 'GET');
  }

  listAllSnapshots(chainType = 'ganache') {
    return this.request(`snapshots/${chainType}`, 'GET');
  }

  listStacksConfigs() {
    return this.request('stack/list', 'GET');
  }

  deleteSnapshot(id) {
    return this.request(`snapshot/${id}`, 'DELETE');
  }

  deleteChain(id) {
    return this.request(`chain/${id}`, 'DELETE');
  }

  downloadSnapshotUrl(id) {
    return `${this._url}/snapshot/${id}`;
  }

  reloadStackConfigs() {
    return this.request('stack/reload', 'GET');
  }

  getDeploymentSteps() {
    return this.request('deployment/steps', 'GET');
  }

  async listAllCommits() {
    let commits = [];
    try {
      const res = await this.request('deployment/commits', 'GET');
      if (res) {
        const {
          data: {
            result: { data }
          }
        } = res;
        commits = data;
      }
    } catch (err) {
      console.error('Error getting commits', err);
    }
    return commits;
  }

  async getBlockNumber(id) {
    const { data } = await this.getChain(id);

    if (data.status !== 'ready') {
      return null;
    } else {
      const url = this._parseChainUrl(data);
      const res = await this.request(
        '',
        'POST',
        url,
        '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
      );
      if (res && res.result) return parseInt(res.result, 16);
    }
  }

  async mineBlock(id) {
    const { data } = await this.getChain(id);

    if (data.status === 'ready' && data.config.type === 'ganache') {
      const url = this._parseChainUrl(data);
      return this.request(
        '',
        'POST',
        url,
        '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}'
      );
    } else {
      throw new Error('Cannot use evm_mine json_rpc post');
    }
  }

  _parseChainUrl(data) {
    const {
      details: { rpc_url }
    } = data;
    const [, _url, _port] = rpc_url.split(':');
    return _url === '//ex-testchain.local'
      ? `http://localhost:${_port}`
      : rpc_url;
  }
}
