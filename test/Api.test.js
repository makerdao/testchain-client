import Client from '../src/Client';
import Api from '../src/core/Api';
import { Event, ChannelName } from '../src/core/constants';

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const chainType = 'geth';

// const testchainUrl = 'http://18.185.172.121:4000';
// const websocketUrl = 'ws://18.185.172.121:4000/socket';
const testchainUrl = process.env.TESTCHAIN_URL || 'http://localhost:4000';
const websocketUrl = process.env.websocketUrl || 'ws://127.0.0.1:4000/socket';

const { API } = ChannelName;
const { OK, ACTIVE, DEPLOYING, DEPLOYED, READY, TERMINATED } = Event;

let client;

const stackPayload = {
  testchain: {
    config: {
      type: chainType,
      accounts: 2,
      block_mine_time: 0,
      clean_on_stop: true
    },
    deps: []
  }
};

beforeEach(() => {
  client = new Client(testchainUrl, websocketUrl);
});

afterEach(async () => {
  const { data: list } = await client.api.listAllChains();
  for (const chain of list) {
    const { id } = chain;
    await client.delete(id);
  }

  for (const type of ['ganache', 'geth']) {
    const { data: snapshots } = await client.api.listAllSnapshots(type);
    for (const { id } of snapshots) {
      await client.api.deleteSnapshot(id);
    }
  }
});

test('API will be created correctly', () => {
  expect(client.api).toBeInstanceOf(Api);
});

test('startStack method will start a geth testchain stack in a READY state', async () => {
  await client.init();
  const {
    data: { id: expectedId }
  } = await client.api.startStack(stackPayload);
  await client.sequenceEvents(expectedId, [OK, READY]);

  const {
    details: { status, id }
  } = await client.api.getChain(expectedId);

  expect(status).toEqual(READY);
  expect(id).toEqual(expectedId);
}, 10000);

// TODO: Finish test implementation when endpoint is fixed.
xtest('getStackInfo will return an object with stack information', async () => {
  await client.init();
  const {
    data: { id }
  } = await client.api.startStack(stackPayload);
  await client.sequenceEvents(id, [OK, READY]);

  const stackInfo = await client.api.getStackInfo(id);
  console.log('stackInfo', stackInfo);
});

test('getChain will return an object with correct chain details', async () => {
  await client.init();
  const {
    data: { id }
  } = await client.api.startStack(stackPayload);
  await client.sequenceEvents(id, [OK, READY]);

  const { details: chainData } = await client.api.getChain(id);
  const { config, chain_details: chainDetails } = chainData;
  const chainDataKeys = Object.keys(chainData);
  const configKeys = Object.keys(config);
  const chainDetailsKeys = Object.keys(chainDetails);

  expect(chainDataKeys).toEqual([
    'status',
    'id',
    'deploy_step',
    'deploy_hash',
    'deploy_data',
    'config',
    'chain_details'
  ]);

  expect(configKeys).toEqual([
    'type',
    'step_id',
    'snapshot_id',
    'node',
    'network_id',
    'id',
    'description',
    'deploy_tag',
    'clean_on_stop',
    'block_mine_time',
    'accounts'
  ]);

  expect(chainDetailsKeys).toEqual([
    'ws_url',
    'rpc_url',
    'network_id',
    'id',
    'gas_limit',
    'coinbase',
    'accounts'
  ]);
});

test('listAllChains will return an array of existing chains', async () => {
  await client.init();
  const {
    data: { id }
  } = await client.api.startStack(stackPayload);
  await client.sequenceEvents(id, [OK, READY]);

  const { data } = await client.api.listAllChains(id);

  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBe(1);
});

// test(
//   'client will create a chain instance with deployments',
//   async () => {
//     await client.init();

//     const eventData = await _create({ ...options, scenario_id: 1 });
//     expect(Object.keys(eventData)).toEqual([
//       Event.OK,
//       Event.DEPLOYING,
//       Event.DEPLOYED,
//       Event.READY,
//       Event.ACTIVE
//     ]);

//     const { ready } = eventData;
//     const { id } = ready;
//     const { details } = await client.api.getChain(id);

//     const { chain_details, deploy_step, deploy_hash } = details;

//     const { deployed } = eventData;
//     expect(Object.keys(deployed)).toEqual([
//       'MCD_JUG',
//       'PROXY_ACTIONS',
//       'MCD_VAT',
//       'MCD_JOIN_REP',
//       'MCD_SPOT',
//       'MCD_DAI',
//       'MCD_MOM_LIB',
//       'CDP_MANAGER',
//       'MCD_PIT',
//       'MCD_FLOP',
//       'VAL_REP',
//       'MCD_DEPLOY',
//       'MCD_FLAP',
//       'PIP_REP',
//       'MCD_FLIP_REP',
//       'VOTE_PROXY_FACTORY',
//       'PROXY_REGISTRY',
//       'PROXY_FACTORY',
//       'MCD_MOVE_DAI',
//       'MCD_GOV',
//       'REP',
//       'MCD_JOIN_DAI',
//       'PIP_ETH',
//       'MCD_ADM',
//       'MCD_MOM',
//       'MCD_FLIP_ETH',
//       'MCD_MOVE_ETH',
//       'MCD_CAT',
//       'MCD_POT',
//       'VAL_ETH',
//       'MCD_VOW',
//       'MCD_JOIN_ETH',
//       'MCD_MOVE_REP',
//       'MCD_GOV_GUARD',
//       'MCD_DAI_GUARD',
//       'MULTICALL'
//     ]);
//     expect(deploy_hash).toBeDefined();
//     expect(deploy_step.description).toEqual('Scenario 1 - General deployment');
//     expect(isEqual(chain_details, ready)).toBe(true);
//   },
//   4 * 60 * 1000
// ); // this test does take 2.5 - 3 minutes
