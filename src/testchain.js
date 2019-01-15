import { Socket } from 'phoenix';
import md5 from 'md5';

const API_CHANNEL = 'api';
const API_URL = 'ws://127.1:4000/socket';

export default class TestChainService {
  constructor() {
    this._socket = null;
    this._apiChannel = null;
    this._apiConnected = false;
    this._chainList = {};
    this._snapShots = {};
  }

  async initialize() {
    await this.connectApp();
    const chains = await this._listChains();

    for (let chain of chains) {
      const options = {
        http_port: chain.http_port,
        accounts: chain.accounts,
        block_mine_time: chain.block_mine_time,
        clean_on_stop: chain.clean_on_stop
      };

      const hash = md5(JSON.stringify(options)); //will have to normalise ordering of values

      this._chainList[chain.id] = {
        channel: this._socket.channel(`chain:${chain.id}`),
        id: chain.id,
        hash: hash,
        config: options,
        connected: false,
        running: chain.status === 'active' ? true : false
      };

      await this._joinChain(chain.id);
    }
  }

  /*
   * connectApp() will by default attempt to connect to a
   * socket url and if successful will then attempt to join
   * it's api channel.
   */
  connectApp(url = API_URL) {
    return new Promise((resolve, reject) => {
      this._socket = new Socket(url, {
        transport: WebSocket
      });

      this._socket.onOpen(async () => {
        await this._joinApi();
        resolve(this._socket.isConnected());
      });

      this._socket.onError(() => reject('SOCKET_ERROR'));
      //this._socket.onMessage(console.log);

      this._socket.connect();
    });
  }

  createListener(event, callback) {
    return new Promise((resolve, reject) => {
      const channel = this._apiChannel;
      channel.on(event, callback);
    });
  }

  _disconnectApp(cb) {
    this._socket.disconnect(cb);
  }

  _joinApi() {
    if (!this._apiChannel) this._apiChannel = this._socket.channel(API_CHANNEL);
    return new Promise((resolve, reject) => {
      if (!this._socket.isConnected())
        reject('Socket Connection Does Not Exist');

      this._apiChannel.join().receive('ok', msg => {
        this._apiConnected = true;
        resolve(msg);
      });
    });
  }

  _leaveApi() {
    return new Promise(resolve => {
      this._apiChannel.leave().receive('ok', () => {
        this._apiConnected = false;
        resolve('left channel');
      });
    });
  }

  // This will automatically join the chain channel on success.
  createChainInstance(options) {
    const hash = md5(JSON.stringify(options)); //will have to normalise ordering of values

    return new Promise((resolve, reject) => {
      if (!this._apiConnected) reject('Not connected to a channel');

      this._apiChannel.push('start', options).receive('ok', async ({ id }) => {
        this._chainList[id] = {
          channel: this._socket.channel(`chain:${id}`),
          id: id,
          hash: hash,
          config: options,
          connected: false,
          running: true,
          eventRefs: {}
        };

        await this._registerDefaultEventListeners(id);
        this._chainOnce(id, 'started', () => {
          resolve(id);
        });
        await this._joinChain(id);
      });
    });
  }

  async _joinChain(id) {
    const { connected } = this._chainList[id];
    if (connected) {
      return 'Chain:' + id + ' already joined';
    }

    return new Promise((resolve, reject) => {
      if (!this._socket.isConnected())
        reject('Socket Connection Does Not Exist');

      this._chainList[id].channel.join().receive('ok', async () => {
        for (let i = 0; i < 100; i++) {
          if (this._chainList[id].channel.state === 'joined') {
            this._chainList[id].connected = true;
            resolve(true);
            break;
          }
          await this._sleep(100);
        }
      });
    });
  }

  _registerDefaultEventListeners(id) {
    return new Promise(resolve => {
      const eventNames = {
        started: 'started',
        error: 'error',
        stopped: 'stopped',
        snapshot_taken: 'snapshot_taken',
        snapshot_reverted: 'snapshot_reverted'
      };

      for (let event of Object.values(eventNames)) {
        if (event === eventNames.error) {
          this._registerEvent(id, 'default', event, err => console.error(err));
        }
        this._registerEvent(id, 'default', event, data =>
          console.log(id, event, data)
        );
      }
      resolve();
    });
  }

  _registerEvent(id, label, event, cb) {
    const ref = this._chainList[id].channel.on(event, cb);
    this._chainList[id].eventRefs[label + ':' + event] = ref;
  }

  _unregisterEvent(id, label, event) {
    const ref = (this._chainList[id] || {}).eventRefs[label + ':' + event];
    delete this._chainList[id].eventRefs[label + ':' + event];
    this._chainList[id].channel.off(event, ref);
  }

  _chainOnce(id, event, cb) {
    // trigger a one-time callback from an event firing
    const randomEventId = Math.random()
      .toString(36)
      .substr(2, 5);
    this._registerEvent(id, `once:${randomEventId}`, event, () => {
      this._unregisterEvent(id, `once:${randomEventId}`, event);
      cb();
    });
  }

  _leaveChain(id) {
    return new Promise(resolve => {
      this._chainList[id].connected = false;
      this._chainList[id].channel.leave().receive('ok', () => resolve(true));
    });
  }

  restartChain(id) {
    if (this._chainList[id].running) return true;

    return new Promise((resolve, reject) => {
      this._chainOnce(id, 'started', () => resolve(true));
      this._apiChannel.push('start_existing', { id }).receive('ok', () => {
        this._chainList[id].running = true;
      });
    });
  }

  stopChain(id) {
    if (!(this._chainList[id] || {}).running) return true;

    return new Promise((resolve, reject) => {
      this._chainOnce(id, 'stopped', async () => {
        this._chainList[id].running = false;

        if (this.isCleanedOnStop(id)) {
          delete this._chainList[id];
        }
        resolve(true);
      });

      this._chainList[id].channel.push('stop');
    });
  }

  takeSnapshot(id, label = 'snap:' + id) {
    return new Promise((resolve, reject) => {
      this._registerEvent(id, label, 'snapshot_taken', res => {
        console.log(res);
        resolve();
      });

      this._chainList[id].channel
        .push('take_snapshot')
        .receive('ok', res => {});
    });
  }

  revertSnapshot(snapshot) {
    const id = this.getSnap(snapshot).chain;
    return new Promise((resolve, reject) => {
      this._chainList[id].channel
        .push('revert_snapshot', { snapshot })
        .receive('ok', res => {
          console.log('snapshot reverted');
          resolve(res);
        });
    });
  }

  async listChains() {
    return await this._listChains();
  }

  _listChains() {
    return new Promise((resolve, reject) => {
      // TODO: check if api channel is connected first
      this._apiChannel.push('list_chains', {}).receive('ok', ({ chains }) => {
        resolve(chains);
      });
      // TODO: error handling?
    });
  }

  async removeChain(id) {
    return await this._removeChain(id);
  }

  async removeAllChains() {
    for (let id of Object.keys(this._chainList)) {
      await this.stopChain(id);
      if (this.isCleanedOnStop(id)) {
        await this._removeChain(id);
      }
    }
  }

  _removeChain(id) {
    console.log('removing chain:' + id);
    return new Promise((resolve, reject) => {
      this._apiChannel.push('remove_chain', { id: id }).receive('ok', data => {
        resolve(data);
      });
    });
  }

  // status methods
  isConnectedSocket() {
    return this._socket.isConnected();
  }

  isConnectedApi() {
    return this._apiConnected;
  }

  getChainList() {
    return this._chainList;
  }

  getChain(id) {
    return this._chainList[id];
  }

  getSnapShots() {
    return this._snapShots;
  }

  getSnap(id) {
    return this._snapShots[id];
  }

  isCleanedOnStop(id) {
    return ((this.getChain(id) || {}).config || {}).clean_on_stop;
  }

  async clearChains() {
    // convenience method to remove all chain instances
    // until delete route is added
    const ids = Object.keys(this._chainList);

    for (let i = 0; i < ids.length; i++) {
      await this.stopChain(ids[i]);
    }
  }

  async _sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}
