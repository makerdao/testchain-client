import Api from './core/Api';
import SocketHandler from './core/SocketHandler';

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: true
};

export default class Client {
  constructor(
    apiUrl = 'http://localhost',
    apiPort = '4000',
    socketUrl = 'ws://127.1:4000/socket'
  ) {
    this._api = new Api(apiUrl, apiPort);
    this._socket = new SocketHandler(socketUrl);
  }

  async init() {
    await this._socket.init();
    await this.once('api', 'phx_reply');
  }

  api() {
    return this._api;
  }

  socket() {
    return this._socket;
  }

  channel(id) {
    return this._socket.channel(id);
  }

  channels() {
    return this._socket._channels;
  }

  stream(id) {
    return this.channel(id).stream();
  }

  once(name, event) {
    return this.channel(name).once(event);
  }

  create(options) {
    this.channel('api').push('start', { ...options });
  }

  stop(id) {
    this.channel(id).push('stop');
  }

  restart(id) {
    this.channel('api').push('start_existing', { id });
  }

  async delete(id) {
    const { details } = await this.api().getChain(id);

    await this.stop(id);

    if (!details.config.clean_on_stop) {
      this.api().deleteChain(id);
    }
    await this.socket()._sleep(2000); // FIXME: Have to wait for server to update
  }

  takeSnapshot(id, description = '') {
    this.channel(id).push('take_snapshot', { description });
  }

  restoreSnapshot(id, snapshot) {
    this.channel(id).push('revert_snapshot', { snapshot });
  }
}
