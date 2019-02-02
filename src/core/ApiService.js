import fetch from 'node-fetch';
import EventService from './EventService';

export default class ApiService {
  constructor(socketService, url = 'http://localhost:4000') {
    this._socket = socketService;
    this._api = null;
    this._url = url;
    this._event = null;
  }

  init() {
    return new Promise(resolve => {
      this._api = this.join('api', ({ channel, message }) => {
        this._api = channel;
        this._event = new EventService(this._api);
        resolve(message);
      });
    });
  }

  join(channelName, cb) {
    const channel = this._socket.channel(channelName);
    channel.join().receive('ok', async ({ message }) => {
      for (let i = 0; i < 20; i++) {
        if (channel.state === 'joined') {
          cb({ channel, message });
          break;
        }
        await this._sleep(100);
      }
    });
  }

  pushAsync(event, payload = {}) {
    return new Promise((resolve, reject) => {
      this._event.once(event, data => {
        resolve(data);
      });

      this._api.push(event, payload);
    });
  }

  pushReceive(event, payload = {}) {
    return new Promise((resolve, reject) => {
      this._api.push(event, payload).receive('ok', resolve);
    });
  }

  leave() {
    return new Promise(resolve => {
      this.api()
        .leave()
        .receive('ok', () => {
          resolve();
        });
    });
  }

  api() {
    return this._api;
  }

  request(route, method = 'GET') {
    return new Promise(async (resolve, reject) => {
      const result = await fetch(this._url + route, { method });
      const { status, ...data } = await result.json();
      status === 0 ? resolve(data) : reject('ChainError: api request failed');
    });
  }

  connected() {
    if (this.api()) {
      return this.api().state === 'joined';
    }
    return false;
  }

  _sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}
