import Api from './core/Api';
import SocketHandler from './core/SocketHandler';

export default class Client {
  constructor(
    serverUrl = 'http://localhost',
    serverPort = '4000',
    apiUrl = 'ws://127.1:4000/socket'
  ) {
    this._api = new Api(serverUrl, serverPort);
    this._socket = new SocketHandler(apiUrl);
  }

  api() {
    return this._api;
  }

  socket() {
    return this._socket();
  }
}
