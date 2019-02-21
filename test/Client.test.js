import Client from '../src/Client';
import SocketHandler from '../src/core/SocketHandler';
import Api from '../src/core/Api';
import { Event } from '../src/core/ChainEvent';
import debug from 'debug';
import { find, isEqual } from 'lodash';

const log = debug('log-test');
const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: false
};

let client;
beforeEach(() => {
  client = new Client();
});

afterEach(async () => {
  const { data: list } = await client.api().listAllChains();
  for (const chain of list) {
    const { id } = chain;
    await client.delete(id);
  }
});

test('client will be created correctly', () => {
  expect(client.socket() instanceof SocketHandler).toBeTruthy();
  expect(client.api() instanceof Api).toBeTruthy();
});

test('client will initialise socket connection', async () => {
  expect(client.socket().connected()).toBeFalsy();
  await client.init();
  expect(client.socket().connected()).toBeTruthy();
  expect(Object.keys(client.channels())[0]).toEqual('api');
  expect(client.channel('api').joined()).toBeTruthy();
});

test('client will create a normal chain instance', async () => {
  await client.init();

  const eventData = await client.create({ ...options });
  expect(Object.keys(eventData)).toEqual([
    Event.CHAIN_STARTED,
    Event.CHAIN_STATUS_ACTIVE,
    Event.CHAIN_READY
  ]);

  const { started } = eventData;
  const { id } = started;

  const { details: { chain_details } } = await client.api().getChain(id);
  expect(isEqual(chain_details, started)).toBeTruthy();
}, (10 * 1000));

test('client will create a chain instance with deployments', async () => {
  await client.init();

  const eventData = await client.create({ ...options, step_id: 1 });
  expect(Object.keys(eventData)).toEqual([
    Event.CHAIN_STARTED,
    Event.CHAIN_DEPLOYING,
    Event.CHAIN_STATUS_ACTIVE,
    Event.CHAIN_DEPLOYED,
    Event.CHAIN_READY
  ]);

  const { started } = eventData;
  const { id } = started;
  const { details } = await client.api().getChain(id);

  const {
    chain_details,
    deploy_step,
    deploy_hash,
  } = details;

  const { deployed } = eventData;
  expect(Object.keys(deployed)).toEqual([
    'MCD_JUG',
    'PROXY_ACTIONS',
    'MCD_VAT',
    'MCD_JOIN_REP',
    'MCD_SPOT',
    'MCD_DAI',
    'MCD_MOM_LIB',
    'CDP_MANAGER',
    'MCD_PIT',
    'MCD_FLOP',
    'VAL_REP',
    'MCD_DEPLOY',
    'MCD_FLAP',
    'PIP_REP',
    'MCD_FLIP_REP',
    'VOTE_PROXY_FACTORY',
    'PROXY_REGISTRY',
    'PROXY_FACTORY',
    'MCD_MOVE_DAI',
    'MCD_GOV',
    'REP',
    'MCD_JOIN_DAI',
    'PIP_ETH',
    'MCD_ADM',
    'MCD_MOM',
    'MCD_FLIP_ETH',
    'MCD_MOVE_ETH',
    'MCD_CAT',
    'MCD_POT',
    'VAL_ETH',
    'MCD_VOW',
    'MCD_JOIN_ETH',
    'MCD_MOVE_REP',
    'MCD_GOV_GUARD',
    'MCD_DAI_GUARD',
    'MULTICALL'
  ]);
  expect(deploy_hash).toBeDefined();
  expect(deploy_step.description).toEqual('Step 1 - General deployment');
  expect(isEqual(chain_details, started)).toBeTruthy();
}, (4 * 60 * 1000)); // this test does take 2.5 - 3 minutes

test('client will stop a chain instance', async () => {
  await client.init();
  const { started } = await client.create({ ...options });
  const { id } = started;

  const eventData = await client.stop(id);
  expect(Object.keys(eventData)).toEqual([
    Event.OK,
    Event.CHAIN_STATUS_TERMINATING,
    Event.CHAIN_TERMINATED
  ]);

  const { details: { status, chain_status } } = await client.api().getChain(id);
  expect(chain_status).toEqual('terminated');
  expect(status).toEqual('terminated');
}, 10000);

test('client will restart a stopped chain', async () => {
  await client.init();
  const { started: { id } } = await client.create({ ...options });
  
  await client.stop(id);
  const { details: { status: status1, chain_status: chain_status1 }} = await client.api().getChain(id);
  expect(status1).toEqual('terminated');
  expect(chain_status1).toEqual('terminated');

  const eventData = await client.restart(id);
  expect(Object.keys(eventData)).toEqual([
    Event.CHAIN_STARTED,
    Event.CHAIN_READY,
    Event.CHAIN_STATUS_ACTIVE
  ]);

  const { details: { status: status2, chain_status: chain_status2 }} = await client.api().getChain(id);
  expect(status2).toEqual('ready');
  expect(chain_status2).toEqual('none'); // FIXME: 'none' is a bit confusing here, was expecting 'active'
}, 10000);

test('client will restart a stopped chain which has deployments', async () => {
  await client.init();
  const { started: { id } } = await client.create({ ...options, step_id: 1 });

  await client.stop(id);
  const { details: { status: status1, chain_status: chain_status1 }} = await client.api().getChain(id);
  expect(status1).toEqual('terminated');
  expect(chain_status1).toEqual('terminated');

  const eventData = await client.restart(id);
  expect(Object.keys(eventData)).toEqual([
    Event.CHAIN_STARTED,
    Event.CHAIN_READY,
    Event.CHAIN_STATUS_ACTIVE
  ]);

  const { details: { status: status2, chain_status: chain_status2 }} = await client.api().getChain(id);
  expect(status2).toEqual('ready');
  expect(chain_status2).toEqual('none'); // FIXME: 'none' is a bit confusing here, was expecting 'active'
}, (4 * 60 * 1000));

test('client will delete a chain', async () => {
  await client.init();
  const { started: { id: id1 } } = await client.create({ ...options });
  const { started: { id: id2 } } = await client.create({ ...options, clean_on_stop: true });

  const { data: list1 } = await client.api().listAllChains();
  expect(find(list1, { id: id1 })).toBeDefined();
  expect(find(list1, { id: id2 })).toBeDefined();

  await client.delete(id1);
  await client.delete(id2);

  const { data: list2 } = await client.api().listAllChains();
  expect(find(list2, { id: id1 })).not.toBeDefined();
  expect(find(list2, { id: id2 })).not.toBeDefined();
}, (20 * 1000));

test('client can take a snapshot', async () => {
  await client.init();
  const { started: { id } } = await client.create({ ...options });

  const snapshotDescription = 'SNAPSHOT';
  const eventData = await client.takeSnapshot(
    id,
    snapshotDescription
  );

  expect(Object.keys(eventData)).toEqual([
    Event.CHAIN_STATUS_TAKING_SNAP,
    Event.SNAPSHOT_TAKEN,
    Event.CHAIN_STATUS_SNAP_TAKEN,
    Event.CHAIN_STATUS_ACTIVE
  ]);
  const { snapshot_taken } = eventData;
  const { id: snapId } = snapshot_taken;
  const { data: list } = await client.api().listAllSnapshots();

  const snapshot_list = find(list, { id: snapId });
  expect(isEqual(snapshot_list, snapshot_taken));
  expect(snapshot_list.description).toEqual(snapshotDescription);
}, (20 * 1000));

test('client can restore a snapshot', async () => {
  await client.init();

  const { started: { id, rpc_url } } = await client.create({ ...options });
  const arr = rpc_url.split(':');
  const url = 'http://localhost';
  const port = arr[2];

  const block = async () => {
    const { result: blockNumber } = await client
      .api()
      .getBlockNumber(url, port);
    return parseInt(blockNumber, 16);
  };

  expect(await block()).toEqual(0);
  const { snapshot_taken: { id: snapshotId } } = await client.takeSnapshot(id, 'SNAPSHOT');

  await client.api().mineBlock(url, port);
  expect(await block()).toEqual(1);

  const eventData = await client.restoreSnapshot(id, snapshotId);

  expect(Object.keys(eventData)).toEqual([
    Event.OK,
    Event.CHAIN_STATUS_REVERTING_SNAP,
    Event.SNAPSHOT_REVERTED,
    Event.CHAIN_STATUS_SNAP_REVERTED,
    Event.CHAIN_STATUS_ACTIVE
  ]);
  expect(await block()).toEqual(0);
});
