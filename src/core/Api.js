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
      } else if (method === 'DELETE') {
        result = await fetch(`${url}/${route}`, {
          method,
          body
        });
      } else {
        result = await fetch(`${url}/${route}`, {
          method,
          body,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      const { status, ...data } = await result.json();
      !status ? resolve(data) : reject(data);
    });
  }

  startStack(config) {
    console.log('start stack args', config);
    // TODO don't hardcode URL
    const url = 'http://localhost:4000';
    const stackOptions = {
      testchain: {
        config,
        deps: []
      }
    };
    const body = JSON.stringify(stackOptions);
    console.log('stack options body', body);
    return this.request('stack/start', 'POST', url, body);
  }

  listAllChains() {
    return this.request('chains/', 'GET');
  }

  listAllSnapshots(chainType = 'ganache') {
    return this.request(`snapshots/${chainType}`, 'GET');
  }

  deleteSnapshot(id) {
    return this.request(`snapshot/${id}`, 'DELETE');
  }

  getChain(id) {
    return this.request(`chain/${id}`, 'GET');
  }

  deleteChain(id) {
    return this.request(`chain/${id}`, 'DELETE');
  }

  downloadSnapshotUrl(id) {
    return `${this._url}/snapshot/${id}`;
  }

  async listAllCommits() {
    const {
      data: {
        result: { data: commits }
      }
    } = await this.request('deployment/commits', 'GET');
    return commits;
  }

  async getBlockNumber(id) {
    const { details: chain } = await this.getChain(id);

    if (chain.status !== 'ready') {
      return null;
    } else {
      const url = this._parseChainUrl(chain);
      const { result: blockNumber } = await this.request(
        '',
        'POST',
        url,
        '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
      );
      return parseInt(blockNumber, 16);
    }
  }

  async mineBlock(id) {
    const { details: chain } = await this.getChain(id);

    if (chain.status === 'ready' && chain.config.type === 'ganache') {
      const url = this._parseChainUrl(chain);
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

  _parseChainUrl(chain) {
    const {
      chain_details: { rpc_url }
    } = chain;
    const [, _url, _port] = rpc_url.split(':');
    return _url === '//ex-testchain.local'
      ? `http://localhost:${_port}`
      : rpc_url;
  }
}
