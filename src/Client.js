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

  chains() {
    return this.chainMgr().chains();
  }

  chain(id) {
    return this.chainMgr().chain(id);
  }

  create(options) {
    return this.chainMgr().createChain(options);
  }

  delete(id) {
    return this.chainMgr().removeChain(id);
  }

  stop(id) {
    return this.chainMgr()
      .chain(id)
      .stop();
  }

  restart(id) {
    return this.chainMgr()
      .chain(id)
      .start();
  }

  takeSnapshot(id, description) {
    return this.chainMgr()
      .chain(id)
      .takeSnapshot(description);
  }

  revertSnapshot(chainId, snapshotId) {
    return this.chainMgr()
      .chain(chainId)
      .revertSnapshot(snapshotId);
  }
}
