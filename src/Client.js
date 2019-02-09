import Api from './core/Api';
import SocketHandler from './core/SocketHandler';

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: true
};

export default class Client {
  constructor(
    serverUrl = 'http://localhost',
    serverPort = '4000',
    apiUrl = 'ws://127.1:4000/socket'
  ) {
    this._api = new Api(serverUrl, serverPort);
    this._socket = new SocketHandler(apiUrl);
  }

  async init() {
    await this._socket.init();
  }

  api() {
    return this._api;
  }

  socket() {
    return this._socket;
  }

  async start() {
    await this.socket().push('api', 'start', { ...options });
  }
  // start
  // stop
  // restart
  // takeSnapshot
  // revertSnapshot
}
