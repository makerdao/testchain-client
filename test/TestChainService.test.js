import { setupTestMakerInstance } from './helpers';
import TestChainService from '../src/testchain';
import 'whatwg-fetch';

jest.setTimeout(20000);

let service;

beforeEach(async () => {
  service = new TestChainService();
  await service.connectApp();
});

afterEach(async () => {
  await service.clearChains();
  /*
   * There appears to be an issue in clearing of chains if they are to be rejoined.
   */
});

const options = {
  http_port: 8545,
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: true
};

test('will connect & disconnect app', async () => {
  expect(service.isConnectedSocket()).toBe(true);
  service._disconnectApp();
  expect(service.isConnectedSocket()).toBe(false);
});

test('will throw error for incorrect connection', async () => {
  expect.assertions(1);
  service = new TestChainService();
  try {
    await service.connectApp('ws://1.1.1.1/socket');
  } catch (e) {
    expect(e).toEqual('SOCKET_ERROR');
  }
});

test('will join & leave api channel', async () => {
  expect(service.isConnectedApi()).toBe(true);
  await service._leaveApi();
  expect(service.isConnectedApi()).toBe(false);
});

test('chain instance can be created', async () => {
  const id = await service.createChainInstance({ ...options });
  const chain = service.getChain(id);
  const chainList = service.getChainList();

  expect(chain.channel.topic).toEqual('chain:' + id);
  expect(chain.channel.state).toEqual('joined');
  expect(chain.hash).toEqual('c25fef28b86a9272b39ada54601e8bbd');
  expect(chain.connected).toEqual(true);
  expect(chain.running).toEqual(true);

  const eventRefs = chain.eventRefs;
  expect(Object.keys(chain.eventRefs)[0]).toEqual('default:started');
  expect(Object.keys(chain.eventRefs)[1]).toEqual('default:error');
  expect(Object.keys(chain.eventRefs)[2]).toEqual('default:stopped');
  expect(Object.keys(chain.eventRefs)[3]).toEqual('default:snapshot_taken');
  expect(Object.keys(chain.eventRefs)[4]).toEqual('default:snapshot_reverted');

  expect(Object.keys(chainList)[0]).toEqual(id);
});

test('chain instance can be stopped', async () => {
  // this test will create a chaindata folder
  const id = await service.createChainInstance({
    ...options,
    clean_on_stop: false
  });

  await service.stopChain(id);
  expect(service.getChain(id).running).toEqual(false);
});

test.skip('chain instance can be restarted', async () => {
  /*
   * Service should enable the restarting of chains which already exist
   * https://github.com/makerdao/ex_testchain/blob/master/apps/web_api/lib/web_api_web/channels/chain_channel.ex
   * Does not seem to indicate that restart is possible as only stop is listed
   */
});

test('will create multiple chains', async () => {
  const chainId1 = await service.createChainInstance({ ...options });
  const chainId2 = await service.createChainInstance({
    ...options,
    http_port: 8546
  });

  const chainList = service.getChainList();
  expect(Object.keys(chainList)[0]).toEqual(chainId1);
  expect(Object.keys(chainList)[1]).toEqual(chainId2);

  const chain1 = service.getChain(chainId1);
  const chain2 = service.getChain(chainId2);

  expect(chain1.connected).toBe(true);
  expect(chain1.running).toBe(true);
  expect(chain2.connected).toBe(true);
  expect(chain2.running).toBe(true);
});

test.skip('chain created with same config as existing chain will use existing chain', async () => {
  /*
   * TODO: Use config hashes to find if pre-existing chain instances already exist
   */
});

test('will create snapshot', async () => {
  const chainId = await service.createChainInstance({ ...options });
  const snapId = await service.takeSnapshot(chainId, 'NEW_SNAPSHOT');

  const snapShots = service.getSnapShots();
  expect(Object.keys(snapShots)[0]).toEqual(snapId);

  const snap = service.getSnap(snapId);
  expect(snap.created instanceof Date).toBe(true);
  expect(snap.chain).toEqual(chainId);
  expect(snap.label).toEqual('NEW_SNAPSHOT');
  expect(snap.route).toEqual('/opt/snapshots/' + chainId + '/' + snapId);
});

test('will revert snapshot', async () => {
  const chainId = await service.createChainInstance({ ...options });
  const snapId = await service.takeSnapshot(chainId, 'NEW_SNAPSHOT');
});

test.skip('can add custom callbacks to chain events', async () => {});

test.skip('can remove callbacks to chain events', async () => {});

test.skip('snapshot workflow: create, edit, revert snapshot', async () => {
  let maker;
  let contract;

  const id = await service.createChainInstance({ ...options });

  const snapId = await service.takeSnapshot(id, 'my new snapshot');
  console.log(service.getSnapShot(snapId));

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
