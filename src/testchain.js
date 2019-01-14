import { Socket } from 'phoenix';
import md5 from 'md5';

const API_CHANNEL = 'api';

export default class TestChainService {
  constructor() {
    this._socket = null;
    this._apiChannel = null;
    this._apiConnected = false;
    this._chain = null;
    this._chainList = {};
  }

  connectApp(url = 'ws://127.1:4000/socket') {
    return new Promise((resolve, reject) => {
      this._socket = new Socket(url, {
        transport: WebSocket
      });

      this._socket.onOpen(() => resolve(this._socket.isConnected()));
      this._socket.onError(() => reject('SOCKET_ERROR'));
      this._socket.onMessage(console.log);

      this._socket.connect();
    });
  }

  disconnectApp(cb) {
    this._socket.disconnect(cb);
  }

  joinApi() {
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

  leaveApi() {
    return new Promise(resolve => {
      this._apiChannel.leave().receive('ok', () => {
        this._apiConnected = false;
        resolve('left channel');
      });
    });
  }

  createChainInstance(options) {
    const hash = md5(JSON.stringify(options)); //will have to normalise ordering of values

    // options.clean_on_stop = true; // force removal on stop until route to delete is added

    return new Promise((resolve, reject) => {
      if (!this._apiConnected) reject('Not connected to a channel');

      this._apiChannel.push('start', options).receive('ok', ({ id: id }) => {
        this._chainList[id] = {
          channel: this._socket.channel(`chain:${id}`),
          metadata: {
            id: id,
            hash: hash,
            config: options,
            connected: false,
            running: true
          }
        };
        resolve(id);
      });
    });
  }

  async joinChain(id) {
    if (this._chain) {
      const { id: chainId, connected } = this._chain.metadata;
      if (connected && chainId === id) {
        // unneccessary to rejoin chain channel if already joined
        return 'Chain:' + id + ' already joined';
      } else {
        await this.leaveChain(this._chain.metadata.id);
      }
    }

    return new Promise((resolve, reject) => {
      this._chain = this._chainList[id];
      if (!this._socket.isConnected())
        reject('Socket Connection Does Not Exist');

      this._chain.channel.join().receive('ok', () => {
        this._chain.metadata.connected = true;
        resolve(true);
      });
    });
  }

  currentChain() {
    return this._chain;
  }

  currentChainId() {
    return this._chain.metadata.id;
  }

  leaveChain() {
    return new Promise(resolve => {
      this._chain.metadata.connected = false;
      this._chain.channel.leave().receive('ok', () => resolve(true));
    });
  }

  startChain() {
    /*
     * May not be possible. Unsure how to restart stopped chain
     */

    if (this._chain.metadata.running) return true;

    const id = this.currentChainId();

    return new Promise((resolve, reject) => {
      this._chain.channel.push('start').receive('ok', () => {
        this._chainList[id].metadata.running = true;
        resolve(true);
      });
    });
  }

  stopChain() {
    if (!this._chain.metadata.running) return true;

    const id = this.currentChainId();
    return new Promise((resolve, reject) => {
      this._chain.channel.push('stop').receive('ok', () => {
        this._chainList[id].metadata.running = false;
        if (this._chainList[id].metadata.config.clean_on_stop) {
          delete this._chainList[id];
        }
        resolve(true);
      });
    });
  }

  takeSnapshot(id) {
    return new Promise((resolve, reject) => {
      this._chain.channel
        .push('take_snapshot')
        .receive('ok', ({ snapshot }) => {
          console.log('Snapshot made for chain %s with id %s', id, snapshot);
          resolve({ snapshot });
        });
    });
  }

  revertSnapshot(id, snapshot) {
    return new Promise((resolve, reject) => {
      this._chain.channel
        .push('revert_snapshot', { snapshot })
        .receive('ok', () => {
          console.log('Snapshot %s reverted to chain %s', snapshot, id);
          resolve();
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

  async clearChains() {
    // convenience method to remove all chain instances
    // until delete route is added

    const ids = Object.keys(this._chainList);

    for (let i = 0; i < ids.length; i++) {
      await this.joinChain(ids[i]);
      await this.stopChain();
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
