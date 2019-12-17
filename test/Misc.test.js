import Client from '../src/Client';
import SocketHandler from '../src/core/SocketHandler';
import Api from '../src/core/Api';
import { ChannelName } from '../src/core/constants';
import { setupClient } from './helpers';

const { API } = ChannelName;

let client;

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

describe('Basic testchain Misc functionality', () => {
  
    test('List of all available stack configs', async () => {
      const { data: data } = await client.api.listStacksConfigs();
      
      expect(typeof data).toBe('object');
    });

    test('Reload available stacks config', async () => {
      const { errors: errors } = await client.api.reloadStackConfigs();
      
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBe(0);
    });

});
