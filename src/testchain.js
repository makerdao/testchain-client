import { Socket } from 'phoenix';
const API_CHANNEL = 'api';

export default class TestChainService {
  constructor() {
    this._socket = null;
    this._apiChannel = null;
    this._channel = null;
    this._chainList = {};

    this.errLogs = {
      //TODO: Move to own file
      FAILED_SOCKET_CONNECTION: new Error('FAILED_SOCKET_CONNECTION'),
      FAILED_CHANNEL_CONNECTION: new Error('FAILED CHANNEL_CONNECTION')
    };
  }

  connectApp(url = 'ws://127.1:4000/socket') {
    return new Promise((resolve, reject) => {
      this._socket = new Socket(url, {
        // logger: (kind, msg, data) => {
        //   console.log(`${kind}: ${msg} Data:`, data);
        // },
        transport: WebSocket
      });

      this._socket.onOpen(() => resolve(this._socket.isConnected()));
      this._socket.onError(() => reject(this.errLogs.FAILED_SOCKET_CONNECTION));

      this._socket.connect();
    });
  }

  disconnectApp(cb) {
    this._socket.disconnect(cb);
  }

  // Should create chain handle joining the API channel?
  async joinApiChannel() {
    if (!this._apiChannel) this._apiChannel = this._socket.channel(API_CHANNEL);
    console.log('api channel', this._apiChannel);
    this._channel = this._apiChannel;
    return await this._joinChannel();
  }

  async joinChain(id) {
    this._channel = this._chainList[id];
    return await this._joinChannel();
  }

  _joinChannel() {
    return new Promise((resolve, reject) => {
      if (!this._socket.isConnected())
        reject('Socket Connection Does Not Exist');
      this._channel
        .join()
        .receive('ok', data => resolve(data))
        .receive('error', err =>
          reject(this.errLogs.FAILED_CHANNEL_CONNECTION, err)
        );
    });
  }

  leaveChannel() {
    return new Promise(resolve => {
      this._channel.leave().receive('ok', () => resolve('left channel'));
    });
  }

  createChain(options) {
    return new Promise((resolve, reject) => {
      if (!this.isConnectedChannel()) reject('Not connected to a channel');

      this._apiChannel
        .push('start', options)
        .receive('ok', ({ id: id }) => {
          this._chainList[id] = this._socket.channel(`chain:${id}`);
          resolve(id);
        })
        .receive('error in channel.push(start)', console.error)
        .receive('timeout', () => console.log('Network issues'));
    });
  }

  stopChainById(id) {
    const chain = this._chainList[id];
    return new Promise((resolve, reject) => {
      chain
        .push('stop')
        .receive('ok', () => {
          console.log('Chain stopped!', id);
          resolve();
        })
        .receive('error', console.error);
    });
  }

  takeSnapshot(id) {
    const chain = this._chainList[id];
    return new Promise((resolve, reject) => {
      chain
        .push('take_snapshot')
        .receive('ok', ({ snapshot }) => {
          console.log('Snapshot made for chain %s with id %s', id, snapshot);
          resolve({ snapshot });
        })
        .receive('error', console.error);
    });
  }

  revertSnapshot(id, snapshot) {
    const chain = this._chainList[id];
    return new Promise((resolve, reject) => {
      chain
        .push('revert_snapshot', { snapshot })
        .receive('ok', () => {
          console.log('Snapshot %s reverted to chain %s', snapshot, id);
          resolve();
        })
        .receive('error', console.error);
    });
  }

  // status methods
  isConnectedSocket() {
    return this._socket.isConnected();
  }

  isConnectedChannel() {
    if (this._channel.state === 'joined') {
      return true;
    } else {
      return false;
    }
  }

  getChainList() {
    return this._chainList;
  }

  getChainById(id) {
    return this._chainList[id];
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
