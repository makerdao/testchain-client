import Client from '../src/Client';
import SocketHandler from '../src/core/SocketHandler';
import Api from '../src/core/Api';
import { Event, ChannelName } from '../src/core/constants';
import isEqual from 'lodash.isequal';
import debug from 'debug';
const log = debug('log:test');

const { API } = ChannelName;

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: false
};

let client;

const _create = async (options) => {
  client.create(options);
  const {
      payload: {
        response: { id }
      }
    } = await client.once(API, Event.OK);

    if (options.step_id) {
      return client.sequenceEvents(id, [
        Event.OK,
        Event.DEPLOYING,
        Event.DEPLOYED,
        Event.READY,
        Event.ACTIVE
      ]);
    } else {
      return client.sequenceEvents(id, [
        Event.OK,
        Event.READY,
        Event.ACTIVE
      ]);
    }
};

const _stop = ( id ) => {
  client.stop(id);
  return client.sequenceEvents(id, [
    Event.OK,
    Event.TERMINATED
  ]);
};

const _restart = ( id ) => {
  client.restart(id);
  return client.sequenceEvents(id, [
    Event.READY
  ]);
};

const _takeSnapshot = (id, description) => {
  client.takeSnapshot(id, description);
  return client.sequenceEvents(id, [
    Event.TAKING_SNAPSHOT,
    Event.SNAPSHOT_TAKEN,
    Event.ACTIVE
  ]);
};

const _restoreSnapshot = async (id, snapshot) => {
  client.restoreSnapshot(id, snapshot);
  return client.sequenceEvents(id, [
    Event.REVERTING_SNAPSHOT,
    Event.SNAPSHOT_REVERTED,
    Event.ACTIVE
  ]);
};

beforeEach(() => {
  client = new Client();
});

afterEach(async () => {
  const { data: list } = await client.api.listAllChains();
  for (const chain of list) {
    const { id } = chain;
    await client.delete(id);
  }
});

test('client will be created correctly', () => {
  expect(client.socket).toBeInstanceOf(SocketHandler);
  expect(client.api).toBeInstanceOf(Api);
});

test('client will initialise socket connection', async () => {
  expect(client.socket.connected).toBe(false);
  await client.init();
  expect(client.socket.connected).toBe(true);
  expect(client.connections[0]).toEqual(API);
  expect(client.channel(API).joined).toBe(true);
});

test('client will create a normal chain instance', async () => {
  await client.init();

  const eventData = await _create({ ...options });
  expect(Object.keys(eventData)).toEqual([
    Event.OK,
    Event.READY,
    Event.ACTIVE
  ]);
  const { ready } = eventData;
  const { id } = ready;

  const { details: { chain_details } } = await client.api.getChain(id);
  expect(isEqual(chain_details, ready)).toBe(true);
}, (10 * 1000));

test('client will create a chain instance with deployments', async () => {
  await client.init();

  const eventData = await _create({ ...options, step_id: 1 });
  expect(Object.keys(eventData)).toEqual([
    Event.OK,
    Event.DEPLOYING,
    Event.DEPLOYED,
    Event.READY,
    Event.ACTIVE
  ]);

  const { ready } = eventData;
  const { id } = ready;
  const { details } = await client.api.getChain(id);

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
  expect(isEqual(chain_details, ready)).toBe(true);
}, (4 * 60 * 1000)); // this test does take 2.5 - 3 minutes

test('client will stop a chain instance', async () => {
  await client.init();
  const { ready } = await _create({ ...options });
  const { id } = ready;

  const eventData = await _stop(id);
  expect(Object.keys(eventData)).toEqual([
    Event.OK,
    Event.TERMINATED
  ]);

  const { details: { status } } = await client.api.getChain(id);
  expect(status).toEqual('terminated');
}, 10000);

test('client will restart a stopped chain', async () => {
  await client.init();
  const { ready: { id } } = await _create({ ...options });

  await _stop(id);
  const { details: { status: status1 }} = await client.api.getChain(id);
  expect(status1).toEqual('terminated');

  const eventData = await _restart(id);
  expect(Object.keys(eventData)).toEqual([
    Event.READY
  ]);

  const { details: { status: status2 }} = await client.api.getChain(id);
  expect(status2).toMatch(/ready|initializing/);
}, 10000);

test('client will delete a chain', async () => {
  await client.init();
  const { ready: { id: id1 } } = await _create({ ...options });
  const { ready: { id: id2 } } = await _create({ ...options, clean_on_stop: true });

  const { data: list1 } = await client.api.listAllChains();
  expect(list1.find( chain => chain.id === id1 )).toBeDefined();
  expect(list1.find( chain => chain.id === id2 )).toBeDefined();

  await client.delete(id1);
  await client.delete(id2);

  const { data: list2 } = await client.api.listAllChains();
  expect(list2.find( chain => chain.id === id1 )).not.toBeDefined();
  expect(list2.find( chain => chain.id === id2 )).not.toBeDefined();
}, (20 * 1000));

test('client will take a snapshot', async () => {
  await client.init();
  const { ready: { id } } = await _create({ ...options });

  const snapshotDescription = 'SNAPSHOT';
  const eventData = await _takeSnapshot(
    id,
    snapshotDescription
  );

  expect(Object.keys(eventData)).toEqual([
    Event.TAKING_SNAPSHOT,
    Event.SNAPSHOT_TAKEN,
    Event.ACTIVE
  ]);

  const { snapshot_taken } = eventData;
  const { id: snapId } = snapshot_taken;
  const { data: list } = await client.api.listAllSnapshots();

  const snapshot_list = list.find(snapshot => snapshot.id === snapId);
  expect(isEqual(snapshot_list, snapshot_taken));
  expect(snapshot_list.description).toEqual(snapshotDescription);
}, (20 * 1000));

test('client will restore a snapshot', async () => {
  await client.init();

  const { ready: { id } } = await _create({ ...options });
  expect(await client.api.getBlockNumber(id)).toEqual(0);
  const { snapshot_taken: { id: snapshotId } } = await _takeSnapshot(id, 'SNAPSHOT');

  await client.api.mineBlock(id);
  expect(await client.api.getBlockNumber(id)).toEqual(1);

  const eventData = await _restoreSnapshot(id, snapshotId);
  expect(Object.keys(eventData)).toEqual([
    Event.REVERTING_SNAPSHOT,
    Event.SNAPSHOT_REVERTED,
    Event.ACTIVE
  ]);
  expect(await client.api.getBlockNumber(id)).toEqual(0);
});
