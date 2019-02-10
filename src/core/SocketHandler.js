import { Socket } from 'phoenix';
import { Observable } from 'rxjs';
import ChannelHandler from './ChannelHandler';
import debug from 'debug';

const log = debug('log:socket');

export default class SocketManager {
  constructor(url = 'ws://127.1:4000/socket') {
    this._socket = new Socket(url, {
      transport: WebSocket
    });

    this._stream = new Observable(subscriber => {
      this._socket.onOpen(() => {
        subscriber.next({ event: 'socket_open' });
      });

      this._socket.onMessage(msg => {
        subscriber.next(msg);
      });

      this._socket.onError(e => {
        // FIXME: responding with onOpen message;
      });
    });

    this._logger = this._stream.subscribe(value =>
      log(JSON.stringify(value, null, 4))
    );

    this._channels = {};
  }

  _once(eventName) {
    return new Promise(resolve => {
      const observer = this._stream.subscribe(({ event }) => {
        if (event === eventName) {
          observer.unsubscribe();
          resolve();
        }
      });
    });
  }

  async init() {
    this._socket.connect();
    await this._once('socket_open');
  }

  channel(name) {
    name = name === 'api' ? 'api' : `chain:${name}`;
    if (!this._channels[name]) {
      this._channels[name] = new ChannelHandler(name, this._socket);
    }
    return this._channels[name];
  }

  connected() {
    return this._socket.isConnected();
  }

  _sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}
