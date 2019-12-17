import Client from '../src/Client';
import SocketHandler from '../src/core/SocketHandler';
import Api from '../src/core/Api';
import { Event, ChannelName } from '../src/core/constants';
import { setupClient, randomString, createDescription } from './helpers';

const { API } = ChannelName;
const { READY } = Event;

const deploymentHash = 'refs/tags/staxx-testrunner';

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

test('Get list of steps', async () => {
  const { data: data } = await client.api.getDeploymentSteps();
  
  expect(typeof data).toBe('object');
  expect(data.tagHash).toHaveLength(40);
  expect(Array.isArray(data.steps)).toBe(true);
  expect(data.steps.length).toBeGreaterThanOrEqual(1);
});

test('Get deployment commits', async () => {
  const commits = await client.api.listAllCommits();

  expect(Array.isArray(commits)).toBe(true);
  expect(commits.length).toBeGreaterThanOrEqual(1);

  expect(commits[0].commit).toHaveLength(40);
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
          description: createDescription('stackDeployment', chainType),
          deploy_tag: deploymentHash,
          step_id: 1
        },
        deps: []
      }
    };

    const email = `${randomString(12)}@makerdao.com`;

    const startedChains = [];
    const snapshots = [];

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

    test(`startStack method will start a ${chainType} testchain stack in a READY state with email header`, async () => {
      // Seting email
      client.api.setEmail(email);
      // Starting chain
      const {
        data: { id: expectedId }
      } = await client.api.startStack(stackPayload);
      
      const eventData = await client.sequenceEvents(expectedId, [
        Event.OK,
        Event.DEPLOYED,
        Event.READY
      ]);

      const { deployed } = eventData;
      expect(deployed).toHaveProperty('PROXY_ACTIONS');
      expect(deployed).toHaveProperty('MCD_VAT');
      expect(deployed).toHaveProperty('ETH');
      expect(deployed).toHaveProperty('PROXY_PAUSE_ACTIONS');
      expect(deployed).toHaveProperty('CDP_MANAGER');

      // Adding to list of started chains
      startedChains.push(expectedId);

      const { details } = await client.api.getChain(expectedId);
      expect(details).toHaveProperty('status', READY);
      expect(details).toHaveProperty('deploy_step');
      expect(details).toHaveProperty('deploy_hash', deploymentHash);
      expect(details).toHaveProperty('deploy_data');

      expect(details.deploy_data).toHaveProperty('PROXY_ACTIONS');
      expect(details.deploy_data).toHaveProperty('MCD_VAT');
      expect(details.deploy_data).toHaveProperty('ETH');
      expect(details.deploy_data).toHaveProperty('PROXY_PAUSE_ACTIONS');
      expect(details.deploy_data).toHaveProperty('CDP_MANAGER');

    }, 20 * 60 * 1000);
  }
);
