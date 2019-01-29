import { Socket } from 'phoenix';

export default class SocketService {
  constructor(name = 'socket') {
    this._socket = null;
  }

  async initialize() {
    await this.connectSocket();
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
    return this.socket().endPointUrl();
  }
}
