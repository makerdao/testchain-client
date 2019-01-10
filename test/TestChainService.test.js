import { setupTestMakerInstance } from './helpers';
import TestChainService from '../src/testchain';
import 'whatwg-fetch';

let service;

beforeEach(() => {
  service = new TestChainService();
});

beforeAll(async () => {
  const options = {
    // type: chain, // For now "geth" or "ganache". (If omited - "ganache" will be used)
    // id: null, // Might be string but normally better to omit
    http_port: 8545, // port for chain. should be changed on any new chain
    //ws_port: 8546, // ws port (only for geth) for ganache will be ignored
    accounts: 3, // Number of account to be created on chain start
    block_mine_time: 0, // how often new block should be mined (0 - instamine)
    clean_on_stop: true // Will delete chain db folder after chain stop
  };

  //maker = await setupTestMakerInstance();
  // smartContract = maker.service('smartContract');
  // chief = maker.service('chief');
  // web3 = maker.service('web3');
  // accounts = maker.service('accounts');
  // testchain = maker.service('testchain');
});

// test('stop chain', async () => {
//   const id = '1663534951757866373';
//   await stopChain(id);
//   // console.log('chainstuff', chainstuff);
// });
// test.skip('get chain', async () => {
//   const id = '9595019168369140627/';
//   await getChain(id);
//   // console.log('chainstuff', chainstuff);
// });

test('will connect app', async () => {
  const isConnected = await service.connectApp();
  expect(isConnected).toBe(true);
});

test('will disconnect app', async () => {
  await service.connectApp();
  service.disconnectApp();
  expect(service.isConnected()).toBe(false);
});

test('will error for incorrect connection', async () => {
  expect.assertions(1);

  try {
    await service.connectApp('ws://0.0.0.0/socket'); //incorrect port
  } catch (e) {
    expect(e).toEqual('Socket Connection Failed');
  }
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
