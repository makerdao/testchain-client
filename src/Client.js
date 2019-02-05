import ChainManager from './core/ChainManager';
import { listAllChains, listAllSnapshots } from './core/api';

export default class Client {
  constructor() {
    this._chainMgr = new ChainManager();
  }

  async init() {
    await this._chainMgr.init();
  }

  chainMgr() {
    return this._chainMgr;
  }

  listAllChains() {
    return listAllChains();
  }

  listAllSnapshots() {
    return listAllSnapshots();
  }
}
