import Client from '../src/Client';
import SocketHandler from '../src/core/SocketHandler';
import Api from '../src/core/Api';
import { Event, ChannelName } from '../src/core/constants';
import isEqual from 'lodash.isequal';
import debug from 'debug';

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const log = debug('log:test');

// const testchainUrl = 'http://18.185.172.121:4000';
// const websocketUrl = 'ws://18.185.172.121:4000/socket';
const testchainUrl = process.env.TESTCHAIN_URL || 'http://localhost:4000';
const websocketUrl = process.env.websocketUrl || 'ws://127.0.0.1:4000/socket';

const { API } = ChannelName;
const { OK, ACTIVE, DEPLOYING, DEPLOYED, READY, TERMINATED } = Event;

let client;

const chainTypes = ['geth', 'ganache'];
// const chainType = 'ganache';

beforeAll(() => {
  client = new Client(testchainUrl, websocketUrl);
});

afterAll(async () => {
  const { data: list } = await client.api.listAllChains();
  for (const chain of list) {
    const { id } = chain;
    await client.delete(id);
    await sleep(10000);
  }

  for (const type of ['ganache', 'geth', 'geth_vdb']) {
    const { data: snapshots } = await client.api.listAllSnapshots(type);
    for (const { id } of snapshots) {
      await client.api.deleteSnapshot(id);
      await sleep(10000);
    }
  }
});

test('client will be created correctly', () => {
  expect(client).toBeInstanceOf(Client);
  expect(client.api).toBeInstanceOf(Api);
  expect(client.socket).toBeInstanceOf(SocketHandler);
});

test('client will initialise socket connection', async () => {
  expect(client.socket.connected).toBe(false);
  await client.init();
  expect(client.socket.connected).toBe(true);
  expect(client.connections[0]).toEqual(API);
  expect(client.channel(API).joined).toBe(true);
});

test('listAllCommits will return an array containing all commits from dss-deploy-scripts repo', async () => {
  const commits = await client.api.listAllCommits();
  const keys = Object.keys(commits[0]);
  expect(keys).toEqual(['text', 'ref', 'date', 'commit', 'author']);
});

describe.each(chainTypes)(
  'Basic testchain functions for %s',
  async chainType => {
    const stackPayload = {
      testchain: {
        config: {
          type: chainType,
          accounts: 2,
          block_mine_time: 0,
          clean_on_stop: false
        },
        deps: []
      }
    };
    let testchainId1;

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

    // beforeAll(() => {
    //   client = new Client(testchainUrl, websocketUrl);
    // });

    // afterAll(async () => {
    //   console.log('AFTER ALL; RUN ONCE');
    //   const { data: list } = await client.api.listAllChains();
    //   for (const chain of list) {
    //     const { id } = chain;
    //     await client.delete(id);
    //   }

    //   await sleep(10000);

    //   for (const type of ['ganache', 'geth', 'geth_vdb']) {
    //     const { data: snapshots } = await client.api.listAllSnapshots(type);
    //     for (const { id } of snapshots) {
    //       await client.api.deleteSnapshot(id);
    //     }
    //   }

    //   await sleep(10000);
    // });

    // test('client will be created correctly', () => {
    //   expect(client).toBeInstanceOf(Client);
    //   expect(client.api).toBeInstanceOf(Api);
    //   expect(client.socket).toBeInstanceOf(SocketHandler);
    // });

    // test('client will initialise socket connection', async () => {
    //   expect(client.socket.connected).toBe(false);
    //   await client.init();
    //   expect(client.socket.connected).toBe(true);
    //   expect(client.connections[0]).toEqual(API);
    //   expect(client.channel(API).joined).toBe(true);
    // });

    test(`startStack method will start a ${chainType} testchain stack in a READY state`, async () => {
      const {
        data: { id: expectedId }
      } = await client.api.startStack(stackPayload);
      await client.sequenceEvents(expectedId, [OK, READY]);

      // Use this ID for the rest of the tests in this block.
      testchainId1 = expectedId;

      const {
        details: { status, id }
      } = await client.api.getChain(expectedId);

      expect(status).toEqual(READY);
      expect(id).toEqual(expectedId);
    }, 10000);

    test('client will stop a chain instance', async () => {
      const eventData = await _stop(testchainId1);
      expect(Object.keys(eventData)).toEqual([OK, TERMINATED]);

      const {
        details: { status }
      } = await client.api.getChain(testchainId1);

      expect(status).toEqual(TERMINATED);
    }, 25000);

    test('client will restart a stopped chain', async () => {
      const {
        details: { status: status1 }
      } = await client.api.getChain(testchainId1);
      expect(status1).toEqual(TERMINATED);

      const eventData = await _restart(testchainId1);
      expect(Object.keys(eventData)).toEqual([READY]);

      const {
        details: { status: status2 }
      } = await client.api.getChain(testchainId1);

      expect(status2).toEqual(READY);
    }, 20000);

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
      const { details: chainData } = await client.api.getChain(testchainId1);
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
      const { data } = await client.api.listAllChains(testchainId1);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
    });

    test(`listAllChains will return snapshots for ${chainType}`, async () => {
      const { data } = await client.api.listAllSnapshots(chainType);
      expect(Array.isArray(data)).toBe(true);
    });

    test('client will take a snapshot of chain', async () => {
      // Note: Taking a snapshot will stop the chain, so config option "clean_on_stop" must be false.

      const timestamp = new Date();
      const snapshotDescription = `Jest takeSnapshot ${chainType} ${timestamp.toUTCString()}`;
      const eventData = await _takeSnapshot(testchainId1, snapshotDescription);

      expect(Object.keys(eventData)).toEqual([
        Event.TAKING_SNAPSHOT,
        Event.SNAPSHOT_TAKEN,
        Event.ACTIVE
      ]);

      const { snapshot_taken } = eventData;
      const { id: snapId } = snapshot_taken;
      const { data: list } = await client.api.listAllSnapshots(chainType);
      const snapshot = list.find(s => s.id === snapId);

      expect(snapshot.description).toBe(snapshotDescription);

      await sleep(4000);
    }, 25000);

    test('client will restore a snapshot', async () => {
      // Note: Taking a snapshot will stop the chain, so config option "clean_on_stop" must be false.

      const timestamp = new Date();
      const snapshotDescription = `Jest restoreSnapshot ${timestamp.toUTCString()}`;
      const {
        snapshot_taken: { id: snapshotId }
      } = await _takeSnapshot(testchainId1, snapshotDescription);

      // must wait for chain to move to status: active before trying to restore snapshot
      await sleep(1000);

      const eventData = await _restoreSnapshot(testchainId1, snapshotId);

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

    test('downloadSnapshot will return a URL to download a snapshot', async () => {
      const { data: snapshots } = await client.api.listAllSnapshots(chainType);

      if (snapshots.length > 0) {
        const url = await client.api.downloadSnapshotUrl(snapshots[0].id);
        expect(url).toEqual(`${testchainUrl}/snapshot/${snapshots[0].id}`);
      }
    });

    test('deleteSnapshot will delete snapshots for a given chain type', async () => {
      const { data: snapshots } = await client.api.listAllSnapshots(chainType);

      for (const { id } of snapshots) {
        expect(snapshots.length).toBeGreaterThan(0);
        await client.api.deleteSnapshot(id);
      }
      const { data: snapshots2 } = await client.api.listAllSnapshots(chainType);
      expect(snapshots2.length).toBe(0);
    });

    test('client will delete a chain', async () => {
      //TODO remove this when no longer necessary
      await sleep(2000);

      const { data: list1 } = await client.api.listAllChains();
      expect(list1.find(chain => chain.id === testchainId1)).toBeDefined();

      await client.delete(testchainId1);

      const { data: list2 } = await client.api.listAllChains();
      expect(list2.find(chain => chain.id === testchainId1)).not.toBeDefined();
    }, 60000);
  }
);

// // test(
// //   'client will create a chain instance with deployments',
// //   async () => {
// //     await client.init();

// //     const eventData = await _create({ ...options, scenario_id: 1 });
// //     expect(Object.keys(eventData)).toEqual([
// //       Event.OK,
// //       Event.DEPLOYING,
// //       Event.DEPLOYED,
// //       Event.READY,
// //       Event.ACTIVE
// //     ]);

// //     const { ready } = eventData;
// //     const { id } = ready;
// //     const { details } = await client.api.getChain(id);

// //     const { chain_details, deploy_step, deploy_hash } = details;

// //     const { deployed } = eventData;
// //     expect(Object.keys(deployed)).toEqual([
// //       'MCD_JUG',
// //       'PROXY_ACTIONS',
// //       'MCD_VAT',
// //       'MCD_JOIN_REP',
// //       'MCD_SPOT',
// //       'MCD_DAI',
// //       'MCD_MOM_LIB',
// //       'CDP_MANAGER',
// //       'MCD_PIT',
// //       'MCD_FLOP',
// //       'VAL_REP',
// //       'MCD_DEPLOY',
// //       'MCD_FLAP',
// //       'PIP_REP',
// //       'MCD_FLIP_REP',
// //       'VOTE_PROXY_FACTORY',
// //       'PROXY_REGISTRY',
// //       'PROXY_FACTORY',
// //       'MCD_MOVE_DAI',
// //       'MCD_GOV',
// //       'REP',
// //       'MCD_JOIN_DAI',
// //       'PIP_ETH',
// //       'MCD_ADM',
// //       'MCD_MOM',
// //       'MCD_FLIP_ETH',
// //       'MCD_MOVE_ETH',
// //       'MCD_CAT',
// //       'MCD_POT',
// //       'VAL_ETH',
// //       'MCD_VOW',
// //       'MCD_JOIN_ETH',
// //       'MCD_MOVE_REP',
// //       'MCD_GOV_GUARD',
// //       'MCD_DAI_GUARD',
// //       'MULTICALL'
// //     ]);
// //     expect(deploy_hash).toBeDefined();
// //     expect(deploy_step.description).toEqual('Scenario 1 - General deployment');
// //     expect(isEqual(chain_details, ready)).toBe(true);
// //   },
// //   4 * 60 * 1000
// // ); // this test does take 2.5 - 3 minutes
