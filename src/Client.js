import Api from './core/Api';
import SocketHandler from './core/SocketHandler';
import { Event } from './core/ChainEvent';
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
    await this.once('api', Event.API_JOIN);
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

  async create(options) {
    this.channel('api').push('start', { ...options });

    const {
      payload: {
        response: { id }
      }
    } = await this.once('api', Event.CHAIN_CREATED);

    if (options.step_id) {
      return await this.sequenceEvents(id, [
        Event.CHAIN_STARTED,
        Event.CHAIN_DEPLOYING,
        Event.CHAIN_STATUS_ACTIVE,
        Event.CHAIN_DEPLOYED,
        Event.CHAIN_READY
      ]);
    } else {
      return await this.sequenceEvents(id, [
        Event.CHAIN_STARTED,
        Event.CHAIN_STATUS_ACTIVE,
        Event.CHAIN_READY
      ]);
    }
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

  async sequenceEvents(id, eventNames) {
    const objPromise = {};
    for (const event of eventNames) {
      if (typeof event === 'function') {
        objPromise[Event.CHAIN_STATUS_CHANGED] = this.once(id, event);
      } else {
        objPromise[event] = this.once(id, event);
      }
    }
    for (const event of Object.keys(objPromise)) {
      const { payload } = await objPromise[event];
      objPromise[event] = payload;
    }
    return objPromise;
  }
}
