import { find } from 'lodash';

export default class ChainObject {
  constructor(id, apiService) {
    this.id = id;
    this._api = apiService;
  }

  async populate(list) {
    const chain = await this.requestChain();

    const { id, ...obj } = chain.details;
    for (const item in obj) {
      this[item] = chain.details[item];
    }
    const listObj = find(list, { id: this.id });
    const keys = [
      'block_mine_time',
      'clean_on_stop',
      'network_id',
      'description',
      'status',
      'type'
    ];
    for (const item of keys) {
      this[item] = listObj[item];
    }
  }

  id() {
    return this._id;
  }

  details() {
    const { _api, ...data } = this;
    return data;
  }

  requestChain() {
    return this._api.request(`/chain/${this.id}`);
  }

  delete() {
    return this._api.request(`/chain/${this.id}`, 'DELETE');
  }
}
