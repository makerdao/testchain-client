import SocketService from './core/SocketService';
import ApiService from './core/ApiService';
import ChainManager from './core/ChainManager';

export default class Client {
  constructor() {
    this._socketService = new SocketService();
    this._apiService = new ApiService(this._socketService);
    this._chainMgr = new ChainManager(this._apiService);
  }

  async init() {
    await this._socketService.init();
    await this._apiService.init();
    await this._chainMgr.init();
  }
}
