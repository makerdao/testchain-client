import { find } from 'lodash';
import EventService from './EventService';

export default class ChainObject {
  constructor(id, apiService) {
    this.id = id;
    this._api = apiService;
    this._channel = null;
    this._channelName = `chain:${id}`;
    this._connected = false;
    this._event = null;
  }

  init(list) {
    return new Promise(async (resolve, reject) => {
      this.populate(list);

      this._api.join(this._channelName, ({ message, channel }) => {
        this._channel = channel;
        this._event = new EventService(this._channel);
        this._connected = true;
        resolve(message);
      });
    });
  }

  stop() {}

  details() {
    const { _api, ...data } = this;
    return data;
  }

  channel() {
    return this._channel;
  }

  get() {
    return this._api.request(`/chain/${this.id}`);
  }

  active() {
    return !!this.active;
  }

  delete(cb) {
    return new Promise(async resolve => {
      await this._api.request(`/chain/${this.id}`, 'DELETE');
      cb();
    });
  }

  async populate(list) {
    const chain = await this.get();
    const { id, ...obj } = chain.details;

    for (const item in obj) {
      this[item] = chain.details[item];
    }

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
  }
}
