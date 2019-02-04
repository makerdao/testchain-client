import SocketService from './core/SocketService';
import ChainManager from './core/ChainManager';

export default class Client {
  constructor() {
    this._socketService = new SocketService();
    this._chainMgr = new ChainManager(this._socketService);
  }

  async init() {
    await this._socketService.init();
    await this._chainMgr.init();
  }
}
