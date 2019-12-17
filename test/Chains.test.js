import Client from '../src/Client';
import SocketHandler from '../src/core/SocketHandler';
import Api from '../src/core/Api';
import { Event, ChannelName } from '../src/core/constants';
import { setupClient, randomString, createDescription } from './helpers';

const { API } = ChannelName;
const { OK, READY, TERMINATING, TERMINATED } = Event;

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
  'Basic testchain Chains functionality for %s',
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
    let testchainId1;
    const email = `${randomString(12)}@makerdao.com`;
    const startedChains = [];

    const _stop = async id => {
      // We should not wait for stop result because
      // We will handle events from WS connection
      client.api.stopStack(id);
      return client.sequenceEvents(id, [TERMINATING, TERMINATED]);
    };

    const _restart = async id => {
      await client.api.restartStack(id);
      return client.sequenceEvents(id, [READY]);
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
        // We don't care about results
        // It might be already stopped and removed
        await client.api.stopStack(id);
      }
    }, 15000);

    test('listAllChains will return an array of chains/empty', async () => {
      const { data } = await client.api.listAllChains(testchainId1);
      expect(Array.isArray(data)).toBe(true);
    });

    test(`listAllChains will return empty list for email ${email}`, async () => {
      client.api.setEmail(email);
      const { data } = await client.api.listAllChains(testchainId1);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
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
        details: { status, id }
      } = await client.api.getChain(expectedId);

      expect(status).toEqual(READY);
      expect(id).toEqual(expectedId);
    }, 10000);

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
      const { data } = await client.api.listAllChains();
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(1);
    });

    test('listAllChains will return an array of existing chains for email', async () => {
      client.api.setEmail(email);
      const { data } = await client.api.listAllChains();
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      // Check for list of existing
      expect(data[0].id).toBe(testchainId1);
    });

    test('client will stop a chain instance', async () => {
      const eventData = await _stop(testchainId1);
      expect(Object.keys(eventData)).toEqual([TERMINATING, TERMINATED]);

      const {
        details: { status }
      } = await client.api.getChain(testchainId1);
      
      expect(status).toEqual(TERMINATED);
    }, 10000);

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
    }, 30000);

    test('client will delete chain and it will be removed from list', async () => {
      await _stop(testchainId1);
      const {
        details: { status: status }
      } = await client.api.getChain(testchainId1);
      expect(status).toEqual(TERMINATED);

      // Removing chain
      await client.api.deleteChain(testchainId1);
      // Check get returns nothing
      const {
        details: details
      } = await client.api.getChain(testchainId1);
      expect(details).toBeNull();
      
      // Check list
      client.api.setEmail(email);
      const { data } = await client.api.listAllChains();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    }, 10000);

  }
);
