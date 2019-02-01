export default class ApiService {
  constructor(socketService) {
    this._socket = socketService;
    this._api = null;
  }

  init() {
    return new Promise(resolve => {
      this.join('api', ({ message, channel }) => {
        this._api = channel;
        resolve(message);
      });
    });
  }

  join(channelName, cb) {
    const channel = this._socket.channel(channelName);
    channel.join().receive('ok', async ({ message }) => {
      for (let i = 0; i < 20; i++) {
        if (channel.state === 'joined') {
          cb({ message, channel });
          break;
        }
        await this._sleep(100);
      }
    });
  }

  pushAsync(event, payload = {}, timeout = 5000) {
    return new Promise((resolve, reject) => {
      this.api()
        .push(event, payload, timeout)
        .receive('ok', resolve)
        .receive('error', reject('ChainError: chain process crashed'))
        .reject(
          'timeout',
          reject('ChainError: chain took too long to respond')
        );
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
