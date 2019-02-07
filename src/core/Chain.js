import { find } from 'lodash';

export default class Chain {
  constructor(id, socket, api) {
    this.id = id;
    this._socket = socket;
    this._api = api;
    this.name = `chain:${id}`;
    this.active = async () => false;
    this.snapshots = {};
    this.info = {};
    this.config = {};
    this.user = {};
  }

  async init() {
    await this.populate();
  }

  start() {
    return new Promise(async resolve => {
      if (this.active) {
        resolve();
      } else {
        await this._socket.push('api', 'start_existing', { id: this.id });
        await this.populate();
        resolve();
      }
    });
  }

  async stop() {
    const isActive = await this.active();
    if (!isActive) {
      return;
    } else {
      await this._socket.push(this.name, 'stop');
      if (!this.clean_on_stop) {
        // TODO: Remove this sleep. Only here as the event 'terminated'
        // which we use to resolve the 'stop' push does not update the data
        // from the _updateInfo request to indicate that it hasn't been stopped.
        // By sleeping on this for 2 seconds, it the request to the chain info
        // should reflect that the chain has been stopped
        await this._socket._sleep(2000);
        await this._updateInfo();
      } else {
        this.constuctor(this.id, this._socket, this._api);
      }
      return;
    }
  }

  takeSnapshot(description) {
    return new Promise(async resolve => {
      const { chain, snapshot } = await this._socket.push(
        this.name,
        'take_snapshot',
        {
          description
        }
      );
      const { id, ...data } = snapshot;
      this.snapshots[id] = { ...data, chain: this.id };
      resolve(snapshot.id);
    });
  }

  revertSnapshot(id) {
    return new Promise(async resolve => {
      await this._socket.push(this.name, 'revert_snapshot', {
        snapshot: id
      });
      delete this.snapshots[id];
      resolve();
    });
  }

  details() {
    const { _socket, _api, snapshots, ...data } = this;
    return data;
  }

  channel() {
    return this._channel;
  }

  snapshot(id) {
    if (!!this.snapshots[id]) {
      return this.snapshots[id];
    } else {
      throw new Error(`Snapshot ${id} Does Not Exist`);
    }
  }

  delete(cb) {
    return new Promise(async resolve => {
      await this.stop();
      if (!this.clean_on_stop) await this._api.deleteChain(this.id);
      cb();
      resolve();
    });
  }

  populate() {
    return new Promise(async resolve => {
      const { details } = await this._api.getChainInfo(this.id);
      const { config, chain_details, ...other } = details;
      this.info = { ...other };
      this.config = { ...config };
      this.user = { ...chain_details };

      this.active = async () => {
        await this._updateInfo();
        return this.info.status === 'ready' ? true : false;
      };

      resolve();
    });
  }

  async _updateInfo() {
    const { details } = await this._api.getChainInfo(this.id);
    const { config, chain_details, ...other } = details;
    this.info = other;
  }
}
