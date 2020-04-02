import Client from '../src/Client';
import SocketHandler from '../src/core/SocketHandler';
import Api from '../src/core/Api';
import { Event, ChannelName } from '../src/core/constants';
import { setupClient, sleep, randomString, createDescription } from './helpers';

const { API } = ChannelName;
const { OK, READY } = Event;

let client;
const chainTypesToTest = ['geth', 'ganache'];

beforeAll(async () => {
  client = setupClient();
  // Check or fail
  expect(client).toBeInstanceOf(Client);
  expect(client.api).toBeInstanceOf(Api);
  expect(client.socket).toBeInstanceOf(SocketHandler);

  // Connecting
  expect(client.socket.connected).toBe(false);
  await client.init();
  expect(client.socket.connected).toBe(true);
  expect(client.connections[0]).toEqual(API);
  expect(client.channel(API).joined).toBe(true);
});

describe.each(chainTypesToTest)(
  'Basic testchain Snapshots functionality for %s',
  async chainType => {
    const stackPayload = {
      testchain: {
        config: {
          type: chainType,
          accounts: 2,
          block_mine_time: 0,
          clean_on_stop: false, // Because we have to test restart
          description: createDescription('stackNoDeployment', chainType)
        },
        deps: []
      }
    };

    let testchainId1, coinbase;

    const email = `${randomString(12)}@makerdao.com`;

    const startedChains = [];
    const snapshots = [];

    const _takeSnapshot = (id, description) => {
      client.takeSnapshot(id, description);
      return client.sequenceEvents(id, [
        Event.CHAIN_STATUS_CHANGED,
        Event.SNAPSHOT_TAKEN,
        Event.READY
      ]);
    };

    const _restoreSnapshot = async (id, snapshot) => {
      client.restoreSnapshot(id, snapshot);
      return client.sequenceEvents(id, [
        Event.CHAIN_STATUS_CHANGED,
        Event.SNAPSHOT_REVERTED,
        Event.READY
      ]);
    };

    afterEach(() => {
      if (!client) {
        return;
      }
      // Empty email for request
      client.api.setEmail('');
    });

    afterAll(async () => {
      // Stopping all started chains
      for (const id of startedChains) {
        await client.api.stopStack(id);
        await client.api.deleteChain(id);
      }
    }, 15000);

    // removing all created snapshots if needed
    afterAll(async () => {
      for (const { id } of snapshots) {
        await client.api.deleteSnapshot(id);
      }
    }, 15000);

    test(`listAllSnapshots for ${chainType} gives list`, async () => {
      const { data: list } = await client.api.listAllSnapshots(chainType);

      expect(Array.isArray(list)).toBe(true);
    });

    test(`startStack method will start a ${chainType} testchain stack in a READY state with email header`, async () => {
      // Seting email
      client.api.setEmail(email);
      // Starting chain
      const {
        data: { id: expectedId }
      } = await client.api.startStack(stackPayload);
      await client.sequenceEvents(expectedId, [OK, READY]);

      // Use this ID for the rest of the tests in this block.
      testchainId1 = expectedId;
      // Adding to list of started chains
      startedChains.push(expectedId);

      const {
        data: { status, id, details: details }
      } = await client.api.getChain(expectedId);

      expect(status).toEqual(READY);
      expect(id).toEqual(expectedId);

      expect(details.coinbase).toBeTruthy();

      coinbase = details.coinbase;
    }, 10000);

    test('client will take a snapshot of chain', async () => {
      // Note: Taking a snapshot will stop the chain, so config option "clean_on_stop" must be false.

      const snapshotDescription = createDescription('takeSnapshot', chainType);

      const eventData = await _takeSnapshot(testchainId1, snapshotDescription);

      expect(Object.keys(eventData)).toEqual(
        expect.arrayContaining([
          // Event.TAKING_SNAPSHOT,
          Event.SNAPSHOT_TAKEN,
          Event.READY
        ])
      );

      const { snapshot_taken } = eventData;
      const { id: snapId } = snapshot_taken;
      const { data: list } = await client.api.listAllSnapshots(chainType);
      const snapshot = list.find(s => s.id === snapId);

      expect(snapshot.description).toBe(snapshotDescription);

      snapshots.push(snapId);

      await sleep(4000);
    }, 30000);

    test('client will restore a snapshot', async () => {
      const snapshotDescription = createDescription('takeSnapshot', chainType);

      const {
        snapshot_taken: { id: snapshotId }
      } = await _takeSnapshot(testchainId1, snapshotDescription);

      // must wait for chain to move to status: active before trying to restore snapshot
      await sleep(1000);

      const eventData = await _restoreSnapshot(testchainId1, snapshotId);

      expect(Object.keys(eventData)).toEqual(
        expect.arrayContaining([
          // Event.REVERTING_SNAPSHOT,
          Event.SNAPSHOT_REVERTED,
          Event.READY
        ])
      );

      const { snapshot_reverted } = eventData;
      const { id: snapId } = snapshot_reverted;
      const { data: list } = await client.api.listAllSnapshots(chainType);
      const snapshot = list.find(snapshot => snapshot.id === snapId);

      expect(snapshot.description).toBe(snapshotDescription);

      const {
        data: { status, id, details: details }
      } = await client.api.getChain(testchainId1);

      expect(status).toEqual(READY);
      expect(id).toEqual(testchainId1);
      expect(coinbase).toEqual(details.coinbase);

      await sleep(1000);
    }, 30000);

    test('downloadSnapshot will return a URL to download a snapshot', async () => {
      const { data: snapshots } = await client.api.listAllSnapshots(chainType);

      if (snapshots.length > 0) {
        const url = await client.api.downloadSnapshotUrl(snapshots[0].id);
        expect(url).toEqual(expect.stringContaining(`/snapshot/${snapshots[0].id}`));
      }
    });

    test('deleteSnapshot will delete snapshots for a given chain type', async () => {
      const { data: snapshots } = await client.api.listAllSnapshots(chainType);

      expect(snapshots.length).toBeGreaterThan(0);
      for (const { id } of snapshots) {
        await client.api.deleteSnapshot(id);
      }
      const { data: snapshots2 } = await client.api.listAllSnapshots(chainType);
      expect(snapshots2.length).toBe(0);
    });

  }
);
