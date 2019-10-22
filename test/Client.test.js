import Client from '../src/Client';
import SocketHandler from '../src/core/SocketHandler';
import Api from '../src/core/Api';
import { Event, ChannelName } from '../src/core/constants';
import isEqual from 'lodash.isequal';
import debug from 'debug';

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const log = debug('log:test');
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

const _stop = id => {
  client.stop(id);
  return client.sequenceEvents(id, [OK, TERMINATED]);
};

const _restart = id => {
  client.restart(id);
  return client.sequenceEvents(id, [READY]);
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
  // Setting inordinately high until we figure out threshhold for circleci
  jest.setTimeout(120000);
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

test('client will be created correctly', () => {
  expect(client).toBeInstanceOf(Client);
  expect(client.socket).toBeInstanceOf(SocketHandler);
});

test('client will initialise socket connection', async () => {
  expect(client.socket.connected).toBe(false);
  await client.init();
  expect(client.socket.connected).toBe(true);
  expect(client.connections[0]).toEqual(API);
  expect(client.channel(API).joined).toBe(true);
});

test('client will stop a chain instance', async () => {
  await client.init();
  const {
    data: { id }
  } = await client.api.startStack(stackPayload);
  await client.sequenceEvents(id, [OK, READY]);

  const eventData = await _stop(id);

  expect(Object.keys(eventData)).toEqual([OK, TERMINATED]);

  const {
    details: { status }
  } = await client.api.getChain(id);

  expect(status).toEqual(TERMINATED);
}, 25000);

xtest('client will restart a stopped chain', async () => {
  await client.init();
  const {
    data: { id }
  } = await client.api.startStack(stackPayload);
  await client.sequenceEvents(id, [OK, READY]);

  await _stop(id);

  await sleep(10000);

  const {
    details: { status: status1 }
  } = await client.api.getChain(id);

  expect(status1).toEqual(TERMINATED);

  const eventData = await _restart(id);
  expect(Object.keys(eventData)).toEqual([READY]);

  const {
    details: { status: status2 }
  } = await client.api.getChain(id);
  expect(status2).toEqual(READY);
}, 20000);

test('client will delete a chain', async () => {
  await client.init();
  const {
    data: { id: id1 }
  } = await client.api.startStack(stackPayload);
  await client.sequenceEvents(id1, [OK, READY]);

  const {
    data: { id: id2 }
  } = await client.api.startStack(stackPayload);
  await client.sequenceEvents(id2, [OK, READY]);

  const { data: list1 } = await client.api.listAllChains();
  expect(list1.find(chain => chain.id === id1)).toBeDefined();
  expect(list1.find(chain => chain.id === id2)).toBeDefined();

  await client.delete(id1);
  await client.delete(id2);

  const { data: list2 } = await client.api.listAllChains();
  expect(list2.find(chain => chain.id === id1)).not.toBeDefined();
  expect(list2.find(chain => chain.id === id2)).not.toBeDefined();
}, 60000);

test('client will take a snapshot of chain started with "clean_on_stop: false"', async () => {
  // Taking a snapshot will stop the chain, so clean_on_stop must be false.
  const modifiedPayload = { ...stackPayload };
  modifiedPayload.testchain.config.clean_on_stop = false;

  await client.init();
  const {
    data: { id: id }
  } = await client.api.startStack(modifiedPayload);
  await client.sequenceEvents(id, [OK, READY]);

  const timestamp = new Date();

  const snapshotDescription = `Jest takeSnapshot ${timestamp.toUTCString()}`;
  const eventData = await _takeSnapshot(id, snapshotDescription);

  expect(Object.keys(eventData)).toEqual([
    Event.TAKING_SNAPSHOT,
    Event.SNAPSHOT_TAKEN,
    Event.ACTIVE
  ]);

  const { snapshot_taken } = eventData;
  const { id: snapId } = snapshot_taken;
  const { data: list } = await client.api.listAllSnapshots(chainType);
  const snapshot = list.find(snapshot => snapshot.id === snapId);

  expect(snapshot.description).toBe(snapshotDescription);

  await sleep(1000);
}, 25000);

test('client will restore a snapshot', async () => {
  // Taking a snapshot will stop the chain, so clean_on_stop must be false.
  const modifiedPayload = { ...stackPayload };
  modifiedPayload.testchain.config.clean_on_stop = false;

  await client.init();
  const {
    data: { id: id }
  } = await client.api.startStack(modifiedPayload);

  await client.sequenceEvents(id, [OK, READY]);

  const timestamp = new Date();
  const snapshotDescription = `Jest restoreSnapshot ${timestamp.toUTCString()}`;
  const {
    snapshot_taken: { id: snapshotId }
  } = await _takeSnapshot(id, snapshotDescription);

  // must wait for chain to move to status: active before trying to restore snapshot
  await sleep(1000);

  const eventData = await _restoreSnapshot(id, snapshotId);

  expect(Object.keys(eventData)).toEqual([
    Event.REVERTING_SNAPSHOT,
    Event.SNAPSHOT_REVERTED,
    Event.ACTIVE
  ]);

  const { snapshot_reverted } = eventData;
  const { id: snapId } = snapshot_reverted;
  const { data: list } = await client.api.listAllSnapshots(chainType);
  const snapshot = list.find(snapshot => snapshot.id === snapId);

  expect(snapshot.description).toBe(snapshotDescription);

  await sleep(1000);
}, 30000);
