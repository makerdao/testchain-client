import { Socket as Websocket } from 'phoenix';
import { Observable } from 'rxjs';
import EventService from './EventService';
import debug from 'debug';

const log = debug('log:socket');

export default class Socket {
  constructor(url = 'ws://127.1:4000/socket') {
    this._socket = new Websocket(url, {
      transport: WebSocket
    });

    this._listener = new Observable(subscriber => {
      this._socket.onOpen(data => {
        subscriber.next({ event: 'socket_open', data });
      });

      this._socket.onClose(data => {
        subscriber.next({ event: 'socket_close', data });
        subscriber.complete();
      });

      this._socket.onMessage(msg => {
        subscriber.next({ msg: 'Socket Message', data: JSON.stringify(msg) });
      });

      this._socket.onError(e => {
        // FIXME: responding with onOpen message;
      });
    });

    this._channels = {};
  }

  init() {
    this._listener.subscribe({
      next(data) {
        log(data);
      },
      error(e) {
        throw new Error(JSON.stringify(e));
      },
      complete() {
        log('Socket Listener Closed');
      }
    });

    this._socket.connect();
  }

  disconnect() {
    this._socket.disconnect();
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
      this._channels[name]['listener'] = new Observable(subscriber => {
        this._channel[name].on('starting', data => {
          subscriber.next({ event: 'starting', data });
        });

        this._channel[name].on('started', data => {
          subscriber.next({ event: 'started', data });
        });

        this._channel[name].on('deploying', data => {
          subscriber.next({ event: 'deploying', data });
        });

        this._channel[name].on('deployed', data => {
          subscriber.next({ event: 'deployed', data });
        });

        this._channel[name].on('deployment_failed', data => {
          subscriber.next({ event: 'deployment_failed', data });
        });

        this._channel[name].on('ready', data => {
          subscriber.next({ event: 'ready', data });
        });

        this._channel[name].on('terminated', data => {
          subscriber.next({ event: 'terminated', data });
        });

        this._channel[name].on('snapshot_taken', data => {
          subscriber.next({ event: 'snapshot_taken', data });
        });

        this._channel[name].on('snapshot_reverted', data => {
          subscriber.next({ event: 'snapshot_reverted', data });
        });
      });
    }
    return this._channels[name];
  }

  channelListener(name) {
    if (this._channel[name] && this._channel[name].listener) {
      return this._channel[name].listener;
    }
  }

  resolveOnEvent(event) {
    return new Promise(resolve => {
      this._listener.subscribe({
        next(obj) {
          const { event: _event, data } = obj;
          if (event === _event) {
            resolve(data);
          }
        }
      });
    });
  }

  join(name) {
    return new Promise((resolve, reject) => {
      if (this._joined(name)) {
        resolve();
      }
      const ref = this.channel(name).on('phx_reply', ({ status }) => {
        if (status === 'ok') {
          this.channel(name).off('phx_reply', ref);
          resolve();
        }
      });
      this.channel(name).join();
    });
  }

  _joined(name) {
    if (this._channels[name] && this._channels[name].state === 'joined')
      return true;
    return false;
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
