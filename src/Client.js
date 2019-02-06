import ChainManager from './core/ChainManager';
import Api from './core/Api';

export default class Client {
  constructor(
    serverUrl = 'http://localhost',
    serverPort = '4000',
    apiUrl = 'ws://127.1:4000/socket'
  ) {
    this._api = new Api(serverUrl, serverPort);
    // this._snapshotMgr = new SnapshotManager();
    this._chainMgr = new ChainManager(this._api, /*this._snapshotMgr*/ apiUrl);
  }

  async init() {
    await this._chainMgr.init();
  }

  chainMgr() {
    return this._chainMgr;
  }

  api() {
    return this._api;
  }

  listAllChains() {
    return this.api().listAllChains();
  }

  listAllSnapshots() {
    return this.api().listAllSnapshots();
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
