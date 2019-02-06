import { find } from 'lodash';

export default class Chain {
  constructor(id, socket, api) {
    this.id = id;
    this._socket = socket;
    this._api = api;
    this.name = `chain:${id}`;
    this.active = async () => false;
    this.snapshots = {};
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

  stop() {
    return new Promise(async resolve => {
      if (!this.active) {
        resolve();
      } else {
        await this._socket.push(this.name, 'stop');
        if (!this.clean_on_stop) await this.populate();
        resolve();
      }
    });
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
      this['info'] = { ...other };
      this['config'] = { ...config };
      this['user'] = { ...chain_details };
      this['active'] = async () => {
        await this._updateStatus();
        return this.info.status === 'ready' ? true : false;
      };
      resolve();
    });
  }

  async _updateStatus() {
    const { details } = await this._api.getChainInfo(this.id);
    const { config, chain_details, ...other } = details;
    this['info'] = other;
  }
}
