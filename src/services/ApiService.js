import Service from '../core/Service.js';

const API_CHANNEL = 'api';

export default class ApiService extends Service {
  constructor(name = 'api') {
    super(name, ['socket']);
    this._socketService = null;
    this._api = null;
  }

  connect() {
    return new Promise(async (resolve, reject) => {
      this._socketService = this.get('socket');
      this._api = this._socketService.channel('API_CHANNEL');
      this._api.join().receive('ok', msg => {
        if (!this._socketService.connected()) {
          reject('Socket Connection Does Not Exist');
        }
        resolve(msg);
      });
    });
  }

  api() {
    return this._api;
  }

  connected() {
    return this._connected();
  }
}
