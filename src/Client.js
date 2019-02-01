import SocketService from './core/SocketService';
import ApiService from './core/ApiService';

export default class Client {
  constructor() {
    this._socketService = new SocketService();
    this._apiService = new ApiService(this._socketService);
  }

  async init() {
    await this._socketService.init();
    await this._apiService.init();
  }
}
