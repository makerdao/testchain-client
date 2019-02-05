import { find } from 'lodash';
import {
  getChainInfo,
  listAllChains,
  listAllSnapshots,
  deleteChain
} from './api';

export default class ChainObject {
  constructor(id, socket) {
    this.id = id;
    this._socket = socket;
    this.name = `chain:${id}`;
    this.active = false;
    this.snapshots = {};
  }

  init(info = []) {
    return new Promise(async resolve => {
      await this.populate();
      if (this.active) {
        const chain = await getChainInfo(this.id);
        const { id, ...obj } = chain.details;

        for (const item in info) {
          this[item] = chain.details[item];
        }
      }
      resolve();
    });
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
    const { _socket, ...data } = this;
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
      if (!this.clean_on_stop) await deleteChain(this.id);
      cb();
      resolve();
    });
  }

  populate() {
    return new Promise(async resolve => {
      const { list } = await listAllChains();
      const listObj = find(list, { id: this.id });
      [
        'http_port',
        'ws_port',
        'block_mine_time',
        'clean_on_stop',
        'network_id',
        'description',
        'status',
        'type',
        'snapshot_id'
      ].forEach(item => {
        this[item] = listObj[item];
      });

      this.active = this.status === 'active' ? true : false;
      if (this.active) {
        const chain = await getChainInfo(this.id);
        const { id, ...obj } = chain.details;

        for (const item in obj) {
          this[item] = chain.details[item];
        }
      }
      resolve();
    });
  }
}
