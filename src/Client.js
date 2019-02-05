import ChainManager from './core/ChainManager';

export default class Client {
  constructor() {
    this._chainMgr = new ChainManager();
  }

  async init() {
    await this._chainMgr.init();
  }
}
