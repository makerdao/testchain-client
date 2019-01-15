import { Socket } from 'phoenix';
import md5 from 'md5';

const API_CHANNEL = 'api';

export default class TestChainService {
  constructor() {
    this._socket = null;
    this._apiChannel = null;
    this._apiConnected = false;
    this._chainList = {};
  }

  async initialize() {
    await this.connectApp();
    const chains = await this._listChains();
    console.log('INITIALIZE CHAINS', chains);
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
      console.log('INIT CHAIN LIST:', this._chainList);
    }
  }

  /*
   * connectApp() will by default attempt to connect to a
   * socket url and if successful will then attempt to join
   * it's api channel.
   */
  connectApp(url = 'ws://127.1:4000/socket') {
    return new Promise((resolve, reject) => {
      this._socket = new Socket(url, {
        transport: WebSocket
      });

      this._socket.onOpen(async () => {
        await this._joinApi();
        resolve(this._socket.isConnected());
      });

      this._socket.onError(() => reject('SOCKET_ERROR'));
      this._socket.onMessage(console.log);

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

    // options.clean_on_stop = true; // force removal on stop until route to delete is added

    return new Promise((resolve, reject) => {
      if (!this._apiConnected) reject('Not connected to a channel');

      this._apiChannel
        .push('start', options)
        .receive('ok', async ({ id: id }) => {
          this._chainList[id] = {
            channel: this._socket.channel(`chain:${id}`),
            id: id,
            hash: hash,
            config: options,
            connected: false,
            running: true
          };

          await this._joinChain(id);
          resolve(id);
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

      this._chainList[id].channel.join().receive('ok', () => {
        this._chainList[id].connected = true;
        resolve(true);
      });
    });
  }

  _leaveChain(id) {
    return new Promise(resolve => {
      this._chainList[id].connected = false;
      this._chainList[id].channel.leave().receive('ok', () => resolve(true));
    });
  }

  startChain(id) {
    /*
     * May not be possible. Unsure how to restart stopped chain
     TODO: wait for 'started' event to return (use listener);
     */

    if (this._chainList[id].running) return true;

    return new Promise((resolve, reject) => {
      this._chainList[id].channel.push('start').receive('ok', () => {
        this._chainList[id].running = true;
        resolve(true);
      });
    });
  }

  stopChain(id) {
    if (!(this._chainList[id] || {}).running) return true;

    return new Promise((resolve, reject) => {
      this._chainList[id].channel
        .push('stop')
        .receive('ok', x => {
          console.log('ok call success', x);
          this._chainList[id].running = false;
          if (this._chainList[id].config.clean_on_stop) {
            delete this._chainList[id];
          }
          resolve(true);
        })
        .receive('error', console.log('Error stopping chain'));
    });
  }

  takeSnapshot(id) {
    return new Promise((resolve, reject) => {
      this._chainList[id].channel
        .push('take_snapshot')
        .receive('ok', ({ snapshot }) => {
          console.log('Snapshot made for chain %s with id %s', id, snapshot);
          resolve({ snapshot });
        });
    });
  }

  revertSnapshot(id, snapshot) {
    return new Promise((resolve, reject) => {
      this._chainList[id].channel
        .push('revert_snapshot', { snapshot })
        .receive('ok', () => {
          console.log('Snapshot %s reverted to chain %s', snapshot, id);
          resolve();
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
    const chains = await this._listChains();
    console.log('list of chains', chains);
    for (let chain of chains) {
      if (chain.status === 'active') await this.stopChain(chain.id);
      await this._removeChain(chain.id);
    }
  }

  _removeChain(id) {
    return new Promise((resolve, reject) => {
      this._apiChannel.push('remove_chain', { id: id }).receive('ok', data => {
        console.log('CHECK FOR THIS', data);
        resolve(data);
      });
    });
  }

  /**
   * 
   * api_channel
    .push('remove_chain', { id: chain_id })
    .receive('ok', () => console.log('Chain removed %s', id))
    .receive('error', console.error)
   */

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

  async clearChains() {
    // convenience method to remove all chain instances
    // until delete route is added
    const ids = Object.keys(this._chainList);

    for (let i = 0; i < ids.length; i++) {
      await this.stopChain(ids[i]);
    }
  }
}

// export async function getChain(id) {
//   chain(id).on('ok', () => console.log('getChain OK'));
// }

// export async function stopChain(id) {
//   return stop(id);
// }

// /**PRIVATE METHODS */

// export function start_channel(id) {
//   chainList[id] = socket.channel(`chain:${id}`);
//   chainList[id]
//     .join()
//     .receive('ok', () => console.log('Joined channel chain', id))
//     .receive('error', console.error);
//   return window[id];
// }

// export function chain(id) {
//   return chainList[id];
// }

// export function stop(id) {
//   chain(id)
//     .push('stop')
//     .receive('ok', () => console.log('Chain stopped !'))
//     .receive('error', console.error);
// }

// export function take_snapshot(id) {
//   chain(id)
//     .push('take_snapshot')
//     .receive('ok', ({ snapshot }) =>
//       console.log('Snapshot made for chain %s with id %s', id, snapshot)
//     )
//     .receive('error', console.error);
// }

// export function revert_snapshot(id, snapshot) {
//   chain(id)
//     .push('revert_snapshot', { snapshot })
//     .receive('ok', () =>
//       console.log('Snapshot %s reverted to chain %s', snapshot, id)
//     )
//     .receive('error', console.error);
// }
