import { Socket, Channel } from 'phoenix';
import EventService from './EventService';
import debug from 'debug';

const log = debug('log:socket');

export default class SocketService {
  constructor() {
    this._url = null;
    this._socket = null;
    this._event = null;
    this._channels = {};
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
        this._event = new EventService(this._socket);
        resolve();
      });

      this._socket.onMessage(msg => {
        log(msg);
        log('\n');
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

  connected() {
    if (this._socket) {
      return this._socket.isConnected();
    }
    return this._socket.isConnected();
  }

  channel(name) {
    if (!this._channels[name]) {
      this._channels[name] = this._socket.channel(name);
    }
    return this._channels[name];
  }

  join(name) {
    return new Promise((resolve, reject) => {
      if (this._joined(name)) {
        resolve();
      }
      this.channel(name)
        .join()
        .receive('ok', async ({ message }) => {
          const channel = this.channel(name);
          for (let i = 0; i < 20; i++) {
            if (channel.state === 'joined') {
              resolve({ channel, message });
              break;
            }
            await this._sleep(100);
          }
        });
    });
  }

  push(channel, event, payload = {}) {
    switch (event) {
      case 'list_chains':
        return this._pushReceive(channel, event, payload);
      case 'remove_chain':
        return this._pushReceive(channel, event, payload);
      default:
        return this._pushEvent(channel, event, payload);
    }
  }

  _joined(name) {
    if (this._channels[name] && this._channels[name].state === 'joined')
      return true;
    return false;
  }

  _pushEvent(name, event, payload = {}) {
    return new Promise(async (resolve, reject) => {
      this._event.once(name, event, data => {
        resolve(data);
      });
      await this.join(name);
      this.channel(name).push(event, payload);
    });
  }

  _pushReceive(name, event, payload = {}) {
    return new Promise(async resolve => {
      await this.join(name);
      this.channel(name)
        .push(event, payload)
        .receive('ok', resolve);
    });
  }

  _sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}
