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

  on(name, event, cb) {
    return this.channel(name).on(event, cb);
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

  async stop(id) {
    this.channel(id).push('stop');
    return await this.sequenceEvents(id, [
      Event.OK,
      Event.CHAIN_STATUS_TERMINATING,
      Event.CHAIN_TERMINATED
    ]);
  }

  async restart(id) {
    this.channel('api').push('start_existing', { id });

    return await this.sequenceEvents(id, [
      Event.CHAIN_STARTED,
      Event.CHAIN_READY,
      Event.CHAIN_STATUS_ACTIVE
    ]);
  }

  async delete(id) {
    const { details } = await this.api().getChain(id);
    if (details.status !== 'terminated') {
      await this.stop(id);
    }

    if (!details.config.clean_on_stop) {
      this.channel('api').push('remove_chain', { id });
    }

    return new Promise(resolve => {
      this.on('api', Event.CHAIN_DELETED, (payload, off) => {
        const { response } = payload;
        if (response.message && response.message === 'Chain removed') {
          off();
          resolve();
        }
      });
    });
  }

  async takeSnapshot(id, description = '') {
    this.channel(id).push('take_snapshot', { description });

    return await this.sequenceEvents(id, [
      Event.CHAIN_STATUS_TAKING_SNAP,
      Event.SNAPSHOT_TAKEN,
      Event.CHAIN_STATUS_SNAP_TAKEN,
      Event.CHAIN_STATUS_ACTIVE
    ]);
  }

  async restoreSnapshot(id, snapshot) {
    this.channel(id).push('revert_snapshot', { snapshot });

    return await this.sequenceEvents(id, [
      Event.OK,
      Event.CHAIN_STATUS_REVERTING_SNAP,
      Event.SNAPSHOT_REVERTED,
      Event.CHAIN_STATUS_SNAP_REVERTED,
      Event.CHAIN_STATUS_ACTIVE
    ]);
  }

  async sequenceEvents(id, eventNames) {
    const res = await Promise.all(eventNames.map(ev => this.once(id, ev)));
    const obj = res.reduce((acc, { event, payload }) => {
      acc[event] = payload;
      return acc;
    }, {});
    return obj;
  }
}
