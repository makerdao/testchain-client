import { setupTestMakerInstance } from './helpers';
import { start } from '../src/testchain';
import 'whatwg-fetch';

let maker;

beforeAll(async () => {
  await start();
  // maker = await setupTestMakerInstance();
  // smartContract = maker.service('smartContract');
  // chief = maker.service('chief');
  // web3 = maker.service('web3');
  // accounts = maker.service('accounts');
  // testchain = maker.service('testchain');
});

test('start testchain', async done => {
  const testchainId = 2;
  maker = await setupTestMakerInstance(testchainId);

  const accounts = maker.service('accounts');
  const accts = accounts.listAccounts();
  console.log('accts', accts);

  const web3 = maker.service('web3');
  const p = web3.web3Provider();
  console.log('providers', p._providers[1].rpcUrl);

  done();
});
