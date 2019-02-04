import { find } from 'lodash';
import { getChainInfo, listAllChains, deleteChain } from './ChainRequest';
import EventService from './EventService';

export default class ChainObject {
  constructor(id, socket) {
    this.id = id;
    this._socket = socket;
    this.name = `chain:${id}`;
    this.active = false;
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

  stop() {
    return new Promise(async resolve => {
      if (!this.status) {
        resolve();
      } else {
        await this._socket.push(this.name, 'stop');
        await this.populate();
        resolve();
      }
    });
  }

  details() {
    const { _socket, ...data } = this;
    return data;
  }

  channel() {
    return this._channel;
  }

  delete(cb) {
    return new Promise(async resolve => {
      if (this.active) {
        await this.stop();
      }

      if (this.exists) await deleteChain(this.id);

      cb();
      resolve();
    });
  }

  async populate() {
    return new Promise(async resolve => {
      const { list } = await listAllChains();
      const listObj = find(list, { id: this.id });
      [
        'block_mine_time',
        'clean_on_stop',
        'network_id',
        'description',
        'status',
        'type'
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
