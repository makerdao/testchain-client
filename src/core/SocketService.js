import { Socket } from 'phoenix';

export default class SocketService {
  constructor() {
    this._url = null;
    this._socket = null;
  }

  init(url = 'ws://127.1:4000/socket') {
    this._url = url;
    return this.connect();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this._socket = new Socket(this._url, {
        transport: WebSocket
      });

      this._socket.onOpen(() => {
        resolve();
      });

      this._socket.onError(e => {
        reject('Socket Failed To Connect');
      });

      this._socket.connect();
    });
  }

  disconnect() {
    return new Promise(resolve => {
      this._socket.disconnect(resolve);
    });
  }

  url() {
    return this._url;
  }

  socket() {
    return this._socket;
  }

  connected() {
    if (this.socket()) {
      return this.socket().isConnected();
    }
    return this._socket.isConnected();
  }

  channel(...args) {
    return this._socket.channel(...args);
  }
}
