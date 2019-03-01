import Api from './core/Api';
import SocketHandler from './core/SocketHandler';
import { Event } from './core/ChainEvent';
import { find } from 'lodash';

export default class Client {
  constructor(
    apiUrl = 'http://localhost:4000',
    socketUrl = 'ws://127.1:4000/socket'
  ) {
    this._api = new Api(apiUrl);
    this._socket = new SocketHandler(socketUrl);
  }

  api() {
    return this._api;
  }

  socket() {
    return this._socket;
  }

  async init() {
    await this.socket().init();
    await this.once('api', Event.API_JOIN);
  }

  channel(id) {
    return this.socket().channel(id);
  }

  connections() {
    return this.socket().channels();
  }

  stream(id) {
    return this.channel(id).stream();
  }

  on(id, event, cb) {
    return this.channel(id).on(event, cb);
  }

  once(id, event) {
    return this.channel(id).once(event);
  }

  async sequenceEvents(id, eventNames) {
    const res = await Promise.all(eventNames.map(ev => this.once(id, ev)));
    const obj = res.reduce((acc, { event, payload }) => {
      acc[event] = payload;
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
    const { data: list } = await this.api().listAllChains();
    const exists = find(list, { id });

    if (!exists) {
      this.create({ snapshot_id: snapshot });
    } else {
      this.channel(id).push('revert_snapshot', { snapshot });
    }
  }

  async delete(id) {
    const { details } = await this.api().getChain(id);
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
          this.socket().removeChannel(id);
          off();
          resolve();
        }
      });
    });
  }
}
