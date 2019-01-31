import { Socket } from 'phoenix';
import Service from '../core/Service.js';

export default class SocketService extends Service {
  constructor(name = 'socket') {
    super(name, ['chainMgr']);
    this._socket = null;
  }

  async start() {
    await this.connect();
  }

  connect(url = 'ws://127.1:4000/socket') {
    return new Promise((resolve, reject) => {
      this._socket = new Socket(url, {
        transport: WebSocket
      });

      this._socket.onOpen(() => {
        this._connected = true;
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

  socket() {
    return this._socket;
  }

  connected() {
    if (this.socket()) {
      return this.socket().isConnected();
    }
    return false;
  }

  url() {
    return this.socket().endPointURL();
  }

  channel(...args) {
    this.socket().channel(...args);
  }
}
