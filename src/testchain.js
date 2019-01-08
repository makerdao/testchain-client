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
window.socket = new Socket('ws://127.1:4000/socket', {
  logger: (kind, msg, data) => {
    console.log(`${kind}: ${msg} Data:`, data);
  },
  transport: WebSocket
});
window.socket.connect();
window.api = window.socket.channel('api');
window.api
  .join()
  .receive('ok', data => console.log('Connected to API channel', data))
  .receive('error', console.log('ERROR JOINING API CHANNEL'));

export async function start(chain = 'ganache') {
  const options = {
    // type: chain, // For now "geth" or "ganache". (If omited - "ganache" will be used)
    // id: null, // Might be string but normally better to omit
    http_port: 8545, // port for chain. should be changed on any new chain
    // ws_port: 8546, // ws port (only for geth) for ganache will be ignored
    accounts: 3, // Number of account to be created on chain start
    block_mine_time: 0, // how often new block should be mined (0 - instamine)
    clean_on_stop: true, // Will delete chain db folder after chain stop
    logger: (kind, msg, data) => {
      console.log(`In Start Function: ${kind}: ${msg}`, data);
    },
    transport: WebSocket
  };

  window.api
    .push('start', options)
    .receive('ok', ({ id: id }) => {
      console.log('Created new chain', id);
      start_channel(id).on('started', async data =>
        console.log('Chain started', data)
      );
    })
    .receive('error in window.api.push(start)', console.error)
    .receive('timeout', () => console.log('Network issues'));
}

export function start_channel(id) {
  window[id] = window.socket.channel(`chain:${id}`);
  window[id]
    .join()
    .receive('ok', () => console.log('Joined channel chain', id))
    .receive('error', console.error);
  return window[id];
}

export function chain(id) {
  return window[id];
}

export function stop(id) {
  chain(id)
    .push('stop')
    .receive('ok', () => console.log('Chain stopped !'))
    .receive('error', console.error);
}

export function take_snapshot(id) {
  chain(id)
    .push('take_snapshot')
    .receive('ok', ({ snapshot }) =>
      console.log('Snapshot made for chain %s with id %s', id, snapshot)
    )
    .receive('error', console.error);
}

export function revert_snapshot(id, snapshot) {
  chain(id)
    .push('revert_snapshot', { snapshot })
    .receive('ok', () =>
      console.log('Snapshot %s reverted to chain %s', snapshot, id)
    )
    .receive('error', console.error);
}
