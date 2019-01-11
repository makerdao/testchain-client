import { setupTestMakerInstance } from './helpers';
import TestChainService from '../src/testchain';
import 'whatwg-fetch';

let service;

beforeEach(() => {
  service = new TestChainService();
});

// beforeAll(async () => {
//   const options = {
//     // type: chain, // For now "geth" or "ganache". (If omited - "ganache" will be used)
//     // id: null, // Might be string but normally better to omit
//     http_port: 8545, // port for chain. should be changed on any new chain
//     //ws_port: 8546, // ws port (only for geth) for ganache will be ignored
//     accounts: 3, // Number of account to be created on chain start
//     block_mine_time: 0, // how often new block should be mined (0 - instamine)
//     clean_on_stop: true // Will delete chain db folder after chain stop
//   };
// });

test('will connect & disconnect app', async () => {
  await service.connectApp();
  expect(service.isConnectedSocket()).toBe(true);
  service.disconnectApp();
  expect(service.isConnectedSocket()).toBe(false);
});

test('will error for incorrect connection', async () => {
  expect.assertions(1);

  try {
    await service.connectApp('ws://0.0.0.0/socket'); //incorrect port
  } catch (e) {
    expect(e).toEqual(service.errLogs.FAILED_SOCKET_CONNECTION);
  }
});

test('will join & leave channel', async () => {
  await service.connectApp();
  await service.joinChannel();
  expect(service.isConnectedChannel()).toBe(true);

  await service.leaveChannel();
  expect(service.isConnectedChannel()).toBe(false);
});

// TODO
// test('will fail to join non-existing channel', async () => {
//   await service.connectApp();
//   await service.joinChannel('fakeChannel');
//   console.log(service._channel);
// });

// test.only('will create, join, and stop a chain with a set of options', async () => {
//   const options = {
//     http_port: 8545,
//     accounts: 3,
//     block_mine_time: 0,
//     clean_on_stop: true
//   };

//   await service.connectApp();
//   await service.joinApiChannel();

//   const id = await service.createChain(options);
//   console.log('my id', id, typeof id);

//   const chain = await service.joinChain(id);
//   console.log('my chain', chain);

//   await service.stopChainById(id);
// });

test.only('will create, join, and stop multiple chains', async () => {
  const options1 = {
    http_port: 8545,
    accounts: 3,
    block_mine_time: 0,
    clean_on_stop: true
  };

  const options2 = {
    http_port: 8546,
    accounts: 3,
    block_mine_time: 0,
    clean_on_stop: true
  };

  await service.connectApp();

  await service.joinApiChannel();

  // Create chain with Options 1
  const id1 = await service.createChain(options1);
  console.log('my id1', id1, typeof id1);

  const chain1 = await service.joinChain(id1);
  console.log('my chain1', chain1);

  // await service.joinApiChannel();
  // Create chain with options 2
  const id2 = await service.createChain(options2);
  console.log('my id2', id2, typeof id2);

  const chain2 = await service.joinChain(id2);
  console.log('my chain2', chain2);

  await service.stopChainById(id1);
  await service.stopChainById(id2);
});

test('snapshot workflow: create, edit, revert snapshot', async () => {
  jest.setTimeout(20000);
  let maker;
  let contract;
  const options = {
    // type: chain, // For now "geth" or "ganache". (If omited - "ganache" will be used)
    // id: null, // Might be string but normally better to omit
    http_port: 8545, // port for chain. should be changed on any new chain
    //ws_port: 8546, // ws port (only for geth) for ganache will be ignored
    accounts: 3, // Number of account to be created on chain start
    block_mine_time: 0, // how often new block should be mined (0 - instamine)
    clean_on_stop: true // Will delete chain db folder after chain stop
  };

  await service.connectApp();
  await service.joinChannel();
  const { id } = await service.createChain(options);

  const chain = service.getChainById(id);
  // console.log(chain);

  await service.startChainById(id);

  const { snapshot } = await service.takeSnapshot(id);
  console.log(snapshot);

  const configWithoutContracts = 3; // corresponds to a dai-plugin-config setting
  maker = await setupTestMakerInstance(configWithoutContracts);

  try {
    contract = maker.service('smartContract').getContractByName('CHIEF');
  } catch (error) {
    // contract doesn't exist
    console.log(error);
  }

  // now deploy contracts
  const configWithContracts = 2; // corresponds to a dai-plugin-config setting
  maker = await setupTestMakerInstance(configWithContracts);

  contract = maker.service('smartContract').getContractByName('CHIEF');
  console.log('name2 is', contract);

  await service.revertSnapshot(id, snapshot);

  maker = await setupTestMakerInstance(configWithoutContracts);

  try {
    contract = maker.service('smartContract').getContractByName('CHIEF');
  } catch ({ message }) {
    // contract doesn't exist after revert snapshot
    console.log('new error:', message);
  }

  await service.stopChainById(id);

  console.log('finished', id);
});

//test('create maker', async () => {

//const testchainId = 2;
//maker = await setupTestMakerInstance(testchainId);

// const accounts = maker.service('accounts');
// const accts = accounts.listAccounts();
// console.log('accts', accts);

// const web3 = maker.service('web3');
// const p = web3.web3Provider();
// console.log('providers', p._providers[1].rpcUrl);

//}, 10000);

/** stuff
 * import { setupTestMakerInstance } from './helpers';
import {
  createNewChain,
  getChain,
  stopChain,
  startChannel,
  startExistingChain
} from '../src/testchain';
import 'whatwg-fetch';

let maker, chainData;
jest.setTimeout(20000);

// chain();

// beforeAll(async done => {
//   const options = {
//     // type: chain, // For now "geth" or "ganache". (If omited - "ganache" will be used)
//     // id: null, // Might be string but normally better to omit
//     http_port: 8545, // port for chain. should be changed on any new chain
//     //ws_port: 8546, // ws port (only for geth) for ganache will be ignored
//     accounts: 3, // Number of account to be created on chain start
//     block_mine_time: 0, // how often new block should be mined (0 - instamine)
//     clean_on_stop: true, // Will delete chain db folder after chain stop
//     logger: (kind, msg, data) => {
//       console.log(`In Start Function: ${kind}: ${msg}`, data);
//     },
//     transport: WebSocket
//   };

//   chainData = await createNewChain(options);
//   // const id = '1663534951757866373';
//   // await startChannel(id);
//   console.log('hi');
// });

beforeAll(async done => {
  const options = {
    // type: chain, // For now "geth" or "ganache". (If omited - "ganache" will be used)
    // id: null, // Might be string but normally better to omit
    // http_port: 8545, // port for chain. should be changed on any new chain
    //ws_port: 8546, // ws port (only for geth) for ganache will be ignored
    // accounts: 3, // Number of account to be created on chain start
    // block_mine_time: 0, // how often new block should be mined (0 - instamine)
    // clean_on_stop: true, // Will delete chain db folder after chain stop
    logger: (kind, msg, data) => {
      console.log(`In Start Function: ${kind}: ${msg}`, data);
    },
    // transport: WebSocket,
    db_path: '/tmp/chains/9148419547439816986/' // For existing chain data. be sure you mounted volume to docker
  };

  await startExistingChain(options);
});

// test('stop chain', async () => {
//   const id = '1663534951757866373';
//   await stopChain(id);
//   // console.log('chainstuff', chainstuff);
// });
test.skip('get chain', async () => {
  const id = '17348255653629230736';
  await getChain(id);
  // console.log('chainstuff', chainstuff);
});

test.only('create maker', async done => {
  const testchainId = 3;
  maker = await setupTestMakerInstance(testchainId);

  const accounts = maker.service('accounts');
  const accts = accounts.listAccounts();
  console.log('accts', accts);

  const web3 = maker.service('web3');
  const p = web3.web3Provider();
  console.log('providers', p._providers[1].rpcUrl);

  const smartContract = maker.service('smartContract');
  const name = smartContract.getContractByName('CHIEF');
  console.log(name);

  done();
});

 */
