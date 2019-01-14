import { setupTestMakerInstance } from './helpers';
import TestChainService from '../src/testchain';
import 'whatwg-fetch';
import md5 from 'md5';

jest.setTimeout(20000);

let service;

const options = () => {
  return {
    http_port: 8545,
    accounts: 3,
    block_mine_time: 0,
    clean_on_stop: false
  };
};

const hash = md5(JSON.stringify(options())); //will have to normalise ordering of values

// TODO: we're cheating here until the testchain events get handled:
const wait = async ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

// test.only('will remove all chains', async () => {
//   service = new TestChainService();
//   await service.initialize();
//   await service.removeAllChains();
// });

describe('app connectivity', async () => {
  beforeAll(async () => {
    service = new TestChainService();
    // await service.connectApp();
    await service.initialize();
  });

  test('will connect & disconnect app', async () => {
    expect(service.isConnectedSocket()).toBe(true);
    service._disconnectApp();
    expect(service.isConnectedSocket()).toBe(false);
  });

  test('will throw error for incorrect connection', async () => {
    expect.assertions(1);
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
});

describe('chain starting and stopping', async () => {
  let id;

  beforeAll(async () => {
    service = new TestChainService();
    // await service.connectApp();
    await service.initialize();
  });

  afterAll(async () => {
    await service.removeAllChains();
  });

  test('chain instance can be created', async () => {
    id = await service.createChainInstance(options());
    const chain = service.getChain(id);
    const chainList = service.getChainList();

    expect(chain.channel.topic).toEqual('chain:' + id);
    expect(chain.channel.state).toEqual('joined');
    expect(chain.hash).toEqual(hash);
    expect(chain.connected).toEqual(true);
    expect(chain.running).toEqual(true);
    expect(Object.keys(chainList)[0]).toEqual(id);
  });

  test('chain instance can be stopped', async () => {
    await service.stopChain(id);

    expect(service.getChain(id).running).toEqual(false);
    await wait(7000);
  });
});

// beforeEach(async () => {
//   service = new TestChainService();
//   // await service.connectApp();
//   await service.initialize();
// });

// afterEach(async () => {
//   // await service.clearChains();
//   await service.removeAllChains();
//   // await service.removeAllChains();
//   /*
//    * There appears to be an issue in clearing of chains if they are to be rejoined.
//    */
// });

// describe('list chains', async () => {
//   let service;
//   beforeAll(async () => {
//     service = new TestChainService();
//     await service.connectApp();

//     // start first chain
//     const op1 = options();
//     const chainId1 = await service.createChainInstance(op1);
//     const started = await service.startChain(chainId1);
//   });

//   afterAll(async () => {
//     await service.removeAllChains();
//   });

//   // first, no chains
//   // const chainsInitial = await service.listChains();
//   // // expect(chainsInitial.length).toBe(0);
//   // console.log('chainsInitial', chainsInitial);

//   test('will list chains', async done => {
//     // const listChainsCallback = async data => {
//     //   let chains2 = await service.listChains();
//     //   done();
//     // };
//     // const event = service.createListener('started', listChainsCallback);

//     const chains = await service.listChains();
//     console.log('chains', chains);

//     // console.log('started?', started);

//     // start second chain
//     // const op2 = options();
//     // const chainId2 = await service.createChainInstance(op2);
//     // const started2 = await service.startChain(chainId2);

//     // const chains2 = await service.listChains();

//     // // await event; // this works, happily
//     // console.log('chains0', chains0);
//     // console.log('chains2', chains2);
//     done();
//   });
// });

// //START HERE

// test.skip('chain instance can be restarted', async () => {
//   /*
//    * Service should enable the restarting of chains which already exist
//    * https://github.com/makerdao/ex_testchain/blob/master/apps/web_api/lib/web_api_web/channels/chain_channel.ex
//    * Does not seem to indicate that restart is possible as only stop is listed
//    */
// });

// test('will create multiple chains', async () => {
//   const chainId1 = await service.createChainInstance({
//     http_port: 8545,
//     accounts: 3,
//     block_mine_time: 0,
//     clean_on_stop: true
//   });

//   const chainId2 = await service.createChainInstance({
//     http_port: 8546,
//     accounts: 3,
//     block_mine_time: 0,
//     clean_on_stop: true
//   });

//   const chainList = service.getChainList();
//   expect(Object.keys(chainList)[0]).toEqual(chainId1);
//   expect(Object.keys(chainList)[1]).toEqual(chainId2);

//   const chain1 = service.getChain(chainId1);
//   const chain2 = service.getChain(chainId2);

//   expect(chain1.connected).toBe(true);
//   expect(chain1.running).toBe(true);
//   expect(chain2.connected).toBe(true);
//   expect(chain2.running).toBe(true);
// });

// test.skip('chain created with same config as existing chain will use existing chain', async () => {
//   /*
//    * TODO: Use config hashes to find if pre-existing chain instances already exist
//    */
// });

// test.skip('snapshot workflow: create, edit, revert snapshot', async () => {
//   let maker;
//   let contract;
//   const options = {
//     // type: chain, // For now "geth" or "ganache". (If omited - "ganache" will be used)
//     // id: null, // Might be string but normally better to omit
//     http_port: 8545, // port for chain. should be changed on any new chain
//     //ws_port: 8546, // ws port (only for geth) for ganache will be ignored
//     accounts: 3, // Number of account to be created on chain start
//     block_mine_time: 0, // how often new block should be mined (0 - instamine)
//     clean_on_stop: true // Will delete chain db folder after chain stop
//   };

//   await service.connectApp();
//   await service.joinChannel();

//   const { id } = await service.createChain(options);

//   const chain = service.getChainById(id);
//   // console.log(chain);

//   await service.startChainById(id);

//   const { snapshot } = await service.takeSnapshot(id);
//   console.log(snapshot);

//   const configWithoutContracts = 3; // corresponds to a dai-plugin-config setting
//   maker = await setupTestMakerInstance(configWithoutContracts);

//   try {
//     contract = maker.service('smartContract').getContractByName('CHIEF');
//   } catch (error) {
//     // contract doesn't exist
//     console.log(error);
//   }

//   // now deploy contracts
//   const configWithContracts = 2; // corresponds to a dai-plugin-config setting
//   maker = await setupTestMakerInstance(configWithContracts);

//   contract = maker.service('smartContract').getContractByName('CHIEF');
//   console.log('name2 is', contract);

//   await service.revertSnapshot(id, snapshot);

//   maker = await setupTestMakerInstance(configWithoutContracts);

//   try {
//     contract = maker.service('smartContract').getContractByName('CHIEF');
//   } catch ({ message }) {
//     // contract doesn't exist after revert snapshot
//     console.log('new error:', message);
//   }

//   await service.stopChainById(id);

//   console.log('finished', id);
// });

// END HERE

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
