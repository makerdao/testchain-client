import Api from './core/Api';
import SocketHandler from './core/SocketHandler';

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
    await this.once('api', event => event === 'phx_reply');
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

  once(name, predicate = () => true) {
    return this.channel(name).once(predicate);
  }

  async create(options) {
    this.channel('api').push('start', { ...options });

    const {
      payload: {
        response: { id }
      }
    } = await this.once('api', event => event === 'phx_reply');
    const p1 = this.once(id, event => event === 'started');
    const p2 = this.once(id, event => event === 'deploying');
    const p3 = this.once(id, event => event === 'deployed');
    const p4 = this.once(id, event => event === 'ready');
    const p5 = this.once(
      id,
      (event, payload) =>
        event === 'status_changed' && payload.data === 'active'
    );

    let chainEventData;
    if (!options.step_id) {
      chainEventData = await Promise.all([p1, p4, p5]);
    } else {
      chainEventData = await Promise.all([p1, p2, p3, p4, p5]);
    }
    return chainEventData;
  }

  stop(id) {
    this.channel(id).push('stop');
  }

  restart(id) {
    this.channel('api').push('start_existing', { id });
  }

  async delete(id) {
    const { details } = await this.api().getChain(id);

    this.stop(id);
    await this.once(id, 'stopped');
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
