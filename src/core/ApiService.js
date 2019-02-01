export default class ApiService {
  constructor(socketService) {
    this._socket = socketService;

    this._api = null;
    this._connected = false;
  }

  init() {
    return new Promise(resolve => {
      this._api = this.join('api', () => {
        this._connected = true;
        resolve();
      });
    });
  }

  join(channelName, cb) {
    const channel = this._socket.channel(channelName);
    return channel.join().receive('ok', async () => {
      for (let i = 0; i < 20; i++) {
        if (channel.state === 'joined') {
          cb();
          break;
        }
        await this._sleep(100);
      }
    });
  }

  api() {
    return this._api;
  }

  connected() {
    return this._connected;
  }

  _sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}