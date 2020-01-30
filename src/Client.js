import Api from './core/Api';
import SocketHandler from './core/SocketHandler';
import { Event, ChannelName, Action } from './core/constants';

const { API } = ChannelName;

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
    await this.once(API, Event.OK);
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
    const obj = res.reduce((acc, { event, payload }) => {
      acc[event] = payload;
      return acc;
    }, {});
    return obj;
  }

  // TODO: Implement correctly
  async sequenceStatuses(id, statusNames) {
    const res = await Promise.all(statusNames.map(ev => this.once(id, ev)));
    const obj = res.reduce((acc, { event, payload }) => {
      acc[event] = payload;
      return acc;
    }, {});
    return obj;
  }

  create(options) {
    this.channel(API).push(Action.START_CHAIN, { ...options });
  }

  takeSnapshot(id, description = '') {
    this.channel(id).push(Action.TAKE_SNAPSHOT, { description });
  }

  async restoreSnapshot(id, snapshotId) {
    const { data: list } = await this.api.listAllChains();
    const exists = list.find(chain => chain.id === id);

    if (exists) {
      this.channel(id).push(Action.RESTORE_SNAPSHOT, { snapshot: snapshotId });
      return true;
    } else {
      throw new Error(`chain${id} does not exist`);
    }
  }

  async delete(id) {
    const { details } = await this.api.getChain(id);

    if (details.status !== Event.TERMINATED) {
      this.stop(id);
      await this.sequenceEvents(id, [Event.OK, Event.TERMINATED]);
    }

    if (!details.config.clean_on_stop) {
      this.channel(API).push(Action.DELETE_CHAIN, { id });
    }

    return new Promise(resolve => {
      this.on(API, Event.OK, (payload, off) => {
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
