import { Socket } from 'phoenix';

export default class ConnectionService {
  constructor(name = 'connections') {
    this._socket = null;
    this._socketUrl = null;
    this._channels = {};
    this._connected = false;
  }

  async initialize(
    settings = {
      url: 'ws://127.1:4000/socket'
    }
  ) {
    this._socketUrl = settings.url;
    await this.connectSocket();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this._socket = new Socket(this._socketUrl, {
        transport: WebSocket
      });

      this._socket.onOpen(() => {
        this._connected = true;
        resolve(this._socket.isConnected());
      });

      this._socket.onError(e => {
        reject('Socket Failed To Connect');
      });

      this._socket.connect();
    });
  }

  socket() {
    return this._socket;
  }
}
