import { Socket } from 'phoenix';
import { setupTestMakerInstance } from '../test/helpers';

// kind is type/action (ex "push").
// msg is channel name and event (ex. "api1 start (1, 2)").
// data is what was passed in to the kind.

/**
 * this project should make a connection to the elixer backend and start up testchains.
 *
 * However, testchains should be designed & tarballed with snapshot for any given scenario
 * this service should basically tell the elixer backend to use
 * a given snapshot and spin it up.
 *
 */

export default class TestChainService {
  constructor() {
    this._socket = null;
    this._channel = null;
    this._chainList = {};
  }

  connectApp(url = 'ws://127.1:4000/socket') {
    return new Promise(resolve => {
      this._socket = new Socket(url, {
        logger: (kind, msg, data) => {
          console.log(`${kind}: ${msg} Data:`, data);
        },
        transport: WebSocket
      });

      this._socket.onOpen(() => {
        resolve(this._socket.isConnected());
      });

      this._socket.connect();
    });
  }

  disconnectApp() {
    return new Promise(resolve => {
      this._socket.onClose(() => {
        resolve('JBJBJ');
      });

      this._socket.disconnect(
        () => {
          console.log('app disconnected');
        },
        1000,
        'sss'
      );
    });
  }

  joinChannel() {
    this._channel = this._socket.channel('api');
    this._channel
      .join()
      .receive('ok', data => {
        console.log('Connected to API channel', data);
      })
      .receive('error', error => console.err(error));
  }

  startChain(options) {
    channel
      .push('start', options)
      .receive('ok', ({ id: id }) => {
        console.log('Created new chain', id);
        start_channel(id).on('started', async data => {
          console.log('Chain started', data);
        });
      })
      .receive('error in channel.push(start)', console.error)
      .receive('timeout', () => console.log('Network issues'));
  }

  // status methods
  isConnected() {
    return this._socket.isConnected();
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
