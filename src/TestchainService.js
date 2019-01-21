import { Socket } from 'phoenix';
import _ from 'lodash';
import debug from 'debug';
import fetch from 'node-fetch';

const logEvent = debug('log:event');
const logSocket = debug('log:socket');
const logDelete = debug('log:delete');

const API_CHANNEL = 'api';
const API_URL = 'ws://127.1:4000/socket';
const API_TIMEOUT = 5000;

export default class TestchainService {
  constructor() {
    this._socket = null;
    this._socketConnected = false;
    this._apiChannel = null;
    this._apiEventRefs = {};
    this._apiConnected = false;
    this._chainList = {};
    this._snapshots = {};
  }

  async initialize() {
    await this.connectApp();
    const chains = await this._listChains();

    for (let chain of chains) {
      const chainData = await this.fetchChain(chain.id);
      const options = {
        accounts: chain.accounts,
        block_mine_time: chain.block_mine_time,
        clean_on_stop: chain.clean_on_stop
      };

      this._chainList[chain.id] = {
        channel: this._socket.channel(`chain:${chain.id}`),
        options: options,
        ...chainData.details,
        connected: false,
        active: chain.status === 'active' ? true : false,
        eventRefs: {}
      };
      await this._registerDefaultEventListeners(chain.id);
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
        this._socketConnected = true;
        await this._joinApi();
        resolve(this._socket.isConnected());
      });

      this._socket.onError(e => {
        reject('SOCKET_ERROR');
      });
      this._socket.onMessage(msg => {
        logSocket(`\n${JSON.stringify(msg, null, 2)}\n`);
      });

      this._socket.connect();
    });
  }

  _disconnectApp(cb) {
    this._socket.disconnect(cb);
    this.constructor();
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

  createChainInstance(options) {
    return new Promise((resolve, reject) => {
      if (!this._apiConnected) reject('Not connected to a channel');

      let chainId = null;
      this._apiOnce('started', async data => {
        const id = chainId;
        this._chainList[id] = {
          channel: this._socket.channel(`chain:${id}`),
          options,
          ...data,
          connected: false,
          active: true,
          eventRefs: {}
        };

        await this._registerDefaultEventListeners(id);
        await this._joinChain(id);
        logEvent(
          `\n chain : ${id}\n event : started\n payload: ${JSON.stringify(
            data,
            null,
            2
          )}\n`
        );
        resolve({ id: id, ...this._chainList[id] });
      });

      this._apiChannel
        .push('start', options, API_TIMEOUT)
        .receive('ok', async ({ id }) => {
          chainId = id;
        })
        .receive('error', async error => {
          reject('ChainCreationError: chain process crashed');
        })
        .receive('timeout', e => {
          reject('ChainCreationError: timeout');
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
        status_changed: 'status_changed',
        snapshot_taken: 'snapshot_taken',
        snapshot_reverted: 'snapshot_reverted'
      };

      for (let event of Object.values(eventNames)) {
        if (event === eventNames.error) {
          this._registerEvent(id, 'default', event, error =>
            logEvent(`ERROR: ${error}`)
          );
        }
        this._registerEvent(id, 'default', event, data => {
          logEvent(
            `\n chain : ${id}\n event : ${event}\n payload: ${JSON.stringify(
              data,
              null,
              2
            )}\n`
          );
        });
      }
      resolve();
    });
  }

  _registerEvent(id, label, event, cb) {
    let ref;

    if (id) {
      ref = this._chainList[id].channel.on(event, cb);
      _.set(this, `_chainList.${id}.eventRefs.${label}:${event}`, ref);
    } else {
      ref = this._apiChannel.on(event, cb);
      this._apiEventRefs[label + ':' + event] = ref;
    }
  }

  _unregisterEvent(id, label, event) {
    let ref;

    if (id) {
      _.set(this, `_chainList.${id}.eventRefs.${label}:${event}`, ref);
      delete this._chainList[id].eventRefs[label + ':' + event];
      this._chainList[id].channel.off(event, ref);
    } else {
      ref = this._apiEventRefs[label + ':' + event];
      delete this._apiEventRefs[label + ':' + event];
      this._apiChannel.off(event, ref);
    }
  }

  _apiOnce(event, cb) {
    this._once(false, event, cb);
  }

  _chainOnce(id, event, cb) {
    this._once(id, event, cb);
  }

  _once(id, event, cb) {
    // trigger a one-time callback from an event firing
    const randomEventId = Math.random()
      .toString(36)
      .substr(2, 5);
    this._registerEvent(id, `once:${randomEventId}`, event, async data => {
      this._unregisterEvent(id, `once:${randomEventId}`, event);
      cb(data);
    });
  }

  _leaveChain(id) {
    return new Promise(resolve => {
      this._chainList[id].connected = false;
      this._chainList[id].channel.leave().receive('ok', () => resolve(true));
    });
  }

  restartChain(id) {
    if (this._chainList[id].active) return true;

    return new Promise((resolve, reject) => {
      this._chainOnce(id, 'started', data => {
        resolve(true);
      });
      this._apiChannel.push('start_existing', { id }).receive('ok', () => {
        this._chainList[id].active = true;
      });
    });
  }

  stopChain(id) {
    return new Promise((resolve, reject) => {
      this._chainOnce(id, 'stopped', async data => {
        this._chainList[id].active = false;
        if (this.isCleanedOnStop(id)) {
          delete this._chainList[id];
        }
        resolve(true);
      });

      this._chainList[id].channel.push('stop').receive('error', () => {
        reject('chain stop error');
      });
    });
  }

  takeSnapshot(id, label = 'snap:' + id) {
    return new Promise((resolve, reject) => {
      this._chainOnce(id, 'snapshot_taken', data => {
        const { id: snapId } = data;
        this._snapshots[snapId] = {
          ...data,
          chainId: id
        };
        this._chainOnce(id, 'started', data => {
          resolve(snapId);
        });
      });
      this._chainList[id].channel.push('take_snapshot', { description: label });
    });
  }

  revertSnapshot(snapshot) {
    const id = this.getSnap(snapshot).chainId;
    return new Promise((resolve, reject) => {
      this._chainOnce(id, 'snapshot_reverted', data => {
        const reverted_snapshot = data;
        this._chainOnce(id, 'started', data => {
          resolve(reverted_snapshot);
        });
      });
      this._chainList[id].channel.push('revert_snapshot', { snapshot });
    });
  }

  /*
   * fetchChain will send a get request to the server for a specific chain based on
   * the id parameter.
   * The server will respond with an object containing a status method 0 or 1.
   * In this instance, 0 is a successful request and a details object with the chain info
   * is passed alongside the status value. Should the status value be 1, the server indicates
   * that the chain does not exist or is stopped.
   */
  fetchChain(id) {
    return new Promise(async (resolve, reject) => {
      const res = await fetch(`http://localhost:4000/chain/${id}`);
      const obj = await res.json();

      if (obj.status) {
        if (await this.chainExists(id)) {
          const { accounts, coinbase, rpc_url, ws_url } = this.getChain(id);
          resolve({
            details: {
              accounts,
              coinbase,
              id,
              rpc_url,
              ws_url
            },
            status: 1
          });
        }

        reject('Chain Does Not Exist');
      } else {
        resolve(obj);
      }
    });
  }

  async fetchDelete(id) {
    const res = await fetch(`http://localhost:4000/chain/${id}`, {
      method: 'DELETE'
    });
    const msg = await res.json();

    if (msg.status) {
      throw new Error('Chain Could Not Be Deleted');
    }

    msg['chain'] = id;
    logDelete(`\n${JSON.stringify(msg, null, 4)}\n`);
  }

  async listChains() {
    return await this._listChains();
  }

  _listChains() {
    // this function will only respond with those chains which
    // have clean_on_stop: false. Use only at initialize.
    return new Promise((resolve, reject) => {
      // TODO: check if api channel is connected first
      this._apiChannel.push('list_chains', {}).receive('ok', ({ chains }) => {
        resolve(chains);
      });
      // TODO: error handling?
    });
  }

  async removeAllChains() {
    for (let id of Object.keys(this._chainList)) {
      if (this.isChainActive(id)) await this.stopChain(id);
      await this.fetchDelete(id);
    }
  }

  // status methods
  isConnectedSocket() {
    return this._socketConnected;
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

  getChainInfo(id) {
    const { channel, eventRefs, ...info } = this._chainList[id];
    return info;
  }

  isChainActive(id) {
    return this.getChain(id).active;
  }

  async chainExists(id) {
    if (this.isChainActive(id)) return true;

    const chains = await this.listChains();
    for (let chain of chains) {
      if (chain.id === id) {
        return true;
      }
    }

    return false;
  }

  getSnapshots() {
    return this._snapshots;
  }

  getSnap(id) {
    return this._snapshots[id];
  }

  isCleanedOnStop(id) {
    return ((this.getChain(id) || {}).config || {}).clean_on_stop;
  }

  async _sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}
