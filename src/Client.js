import Api from './core/Api';
import SocketHandler from './core/SocketHandler';
import { Event } from './core/ChainEvent';

export default class Client {
  constructor(
    apiUrl = 'http://localhost:4000',
    socketUrl = 'ws://127.1:4000/socket'
  ) {
    this._api = new Api(apiUrl);
    this._socket = new SocketHandler(socketUrl);
  }

  get api() {
    return this._api;
  }

  get socket() {
    return this._socket;
  }

  get connections() {
    return this.socket.channels;
  }

  async init() {
    await this.socket.init();
    await this.once('api', Event.API_JOIN);
  }

  channel(id) {
    return this.socket.channel(id);
  }

  stream(id) {
    return this.channel(id).stream;
  }

  on(id, eventName, cb) {
    return this.channel(id).on(eventName, cb);
  }

  once(id, eventName) {
    return this.channel(id).once(eventName);
  }

  async sequenceEvents(id, eventNames) {
    const res = await Promise.all(eventNames.map(ev => this.once(id, ev)));
    const obj = res.reduce((acc, { eventName, payload }) => {
      acc[eventName] = payload;
      return acc;
    }, {});
    return obj;
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

  takeSnapshot(id, description = '') {
    this.channel(id).push('take_snapshot', { description });
  }

  async restoreSnapshot(id, snapshot) {
    const { data: list } = await this.api.listAllChains();
    const exists = list.find(chain => chain.id === id);

    if (exists) {
      this.channel(id).push('revert_snapshot', { snapshot });
    } else {
      throw new Error(`chain${id} does not exist`);
    }
  }

  async delete(id) {
    const { details } = await this.api.getChain(id);
    if (details.status !== 'terminated') {
      this.stop(id);
      await this.sequenceEvents(id, [
        Event.OK,
        Event.CHAIN_STATUS_TERMINATING,
        Event.CHAIN_TERMINATED
      ]);
    }

    if (!details.config.clean_on_stop) {
      this.channel('api').push('remove_chain', { id });
    }

    return new Promise(resolve => {
      this.on('api', Event.CHAIN_DELETED, (payload, off) => {
        const { response } = payload;
        if (response.message && response.message === 'Chain removed') {
          this.socket.removeChannel(id);
          off();
          resolve();
        }
      });
    });
  }
}
