import Service from './core/Service.js';

export default class ChainManagerService extends Service {
  constructor(name = 'chainMgr') {
    super(name, ['socket', 'api']);
  }

  start() {}

  async connect() {
    this._api = this._socket.channel(this._apiChannel);
    await this._joinApi();
  }

  _joinApi() {
    return new Promise((resolve, reject) => {
      this._api.join().receive('ok', msg => {
        if (!this._socket.connected()) {
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
