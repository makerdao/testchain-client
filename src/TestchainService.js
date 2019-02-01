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
const HTTP_URL = 'http://localhost:4000';

export default class TestchainService {
  constructor() {
    this._socket = null;
    this._socketConnected = false;
    this._apiChannel = null;
    this._apiEventRefs = {};
    this._apiConnected = false;
    this._chainList = {};
    this._snapshots = [];
  }

  async initialize() {
    await this.connectApp();
    const chains = await this.fetchChains();

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

    const snapshots = await this.fetchSnapshots();
    snapshots.map(snapshot => (this._snapshots[snapshot.id] = snapshot));
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

  _disconnectApp() {
    if (this._socketConnected) {
      return new Promise(resolve => {
        this._socket.disconnect(() => {
          this.constructor();
          resolve();
        });
      });
    }
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

  /**Event handling services */
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

  async stopChain(id) {
    const exists = await this.chainExists(id);
    return new Promise((resolve, reject) => {
      if (!exists) reject(`No chain with ID ${id}`);
      this._chainOnce(id, 'stopped', async data => {
        this._chainList[id].active = false;
        if (this.isCleanedOnStop(id)) {
          await this._leaveChain(id);
          logDelete(`\n"stopping and deleting chain:${id}\n`);
          delete this._chainList[id];
        }
        resolve(true);
      });

      this._chainList[id].channel.push('stop').receive('error', () => {
        reject('chain stop error');
      });
    });
  }

  /**Snapshot services */
  takeSnapshot(options) {
    const { chainId, description } = options;
    // TODO move this hack into a private method so it can be easily removed when we have chain/snapshot link available in ex_testchain
    const label = `{"snap":"${chainId}","desc":"${description}"}`;
    return new Promise((resolve, reject) => {
      this._chainOnce(chainId, 'snapshot_taken', data => {
        const { id: snapId } = data;
        this._snapshots[snapId] = {
          ...data,
          chainId
        };
        this._chainOnce(chainId, 'started', data => {
          resolve(snapId);
        });
      });
      this._chainList[chainId].channel.push('take_snapshot', {
        description: label
      });
    });
  }

  restoreSnapshot(snapshotId) {
    const snapshot = this.getSnap(snapshotId);
    let chainId;
    if (snapshot) chainId = snapshot.chainId;

    return new Promise((resolve, reject) => {
      if (!chainId) reject('No chain associated with this snapshot.');
      this._chainOnce(chainId, 'snapshot_reverted', data => {
        const reverted_snapshot = data;
        this._chainOnce(chainId, 'started', data => {
          resolve(reverted_snapshot);
        });
      });

      this._chainList[chainId].channel
        .push('revert_snapshot', {
          snapshot: snapshotId
        })
        .receive('error', console.error)
        .receive('timeout', () =>
          console.log('Timeout loading list of snapshots')
        );
    });
  }

  getSnapshots() {
    return this._snapshots;
  }

  getSnap(id) {
    return this._snapshots[id];
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
      const res = await fetch(`${HTTP_URL}/chain/${id}`);
      const obj = await res.json();

      obj.status === 0 ? resolve(obj) : reject('Chain Does Not Exist');
    });
  }

  fetchChains() {
    return new Promise(async (resolve, reject) => {
      const res = await fetch(`${HTTP_URL}/chains`);
      const { list } = await res.json();
      resolve(list);
    });
  }

  fetchSnapshots() {
    const chainType = 'ganache';
    return new Promise(async (resolve, reject) => {
      const res = await fetch(`${HTTP_URL}/chain/snapshots/${chainType}`);
      const { list, status } = await res.json();
      // TODO move this hack into a private method so it can be easily removed when we have chain/snapshot link available in ex_testchain
      list.map(snapshot => {
        const json = JSON.parse(snapshot.description);
        snapshot.description = json.desc;
        snapshot.chainId = json.snap;
      });
      status === 0 ? resolve(list) : reject('Error fetching snapshot');
    });
  }

  fetchDelete(id) {
    return new Promise(async (resolve, reject) => {
      const res = await fetch(`${HTTP_URL}/chain/${id}`, {
        method: 'DELETE'
      });
      const msg = await res.json();

      if (msg.status) {
        logDelete(msg);
        reject('Chain Could Not Be Deleted');
      } else {
        msg['chain'] = id;
        logDelete(`\n${JSON.stringify(msg, null, 4)}\n`);
        await this._leaveChain(id);
        resolve();
      }
    });
  }

  async removeAllChains() {
    const chainList = await this.fetchChains();
    for (const chain of chainList) {
      const id = chain.id;
      if (this.isChainActive(id)) {
        await this.stopChain(id);
      }

      if (await this.chainExists(id)) {
        await this.fetchDelete(id);
      }
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
    const chainList = Object.values(this._chainList);
    return chainList.find(chain => chain.id === id);
  }

  getChainInfo(id) {
    const { channel, eventRefs, ...info } = this._chainList[id];
    return info;
  }

  isChainActive(id) {
    const chain = this.getChain(id);
    return chain ? chain.active : false;
  }

  async chainExists(id) {
    if (this.isChainActive(id)) return true;

    const chains = await this.fetchChains();
    for (let chain of chains) {
      if (chain.id === id) {
        return true;
      }
    }

    return false;
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
