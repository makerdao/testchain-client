import Client from '../src/Client';
import SocketHandler from '../src/core/SocketHandler';
import Api from '../src/core/Api';
import { ChannelName } from '../src/core/constants';

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// const testchainUrl = 'http://18.185.172.121:4000';
// const websocketUrl = 'ws://18.185.172.121:4000/socket';
const testchainUrl = process.env.TESTCHAIN_URL || 'http://localhost:4000';
const websocketUrl = process.env.websocketUrl || 'ws://127.0.0.1:4000/socket';

const { API } = ChannelName;
let client;

beforeAll(() => {
  client = new Client(testchainUrl, websocketUrl);
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

test.skip('listAllCommits will return an array containing all commits from dss-deploy-scripts repo', async () => {
  const commits = await client.api.listAllCommits();
  const keys = Object.keys(commits[0]);
  expect(keys).toEqual(['text', 'ref', 'date', 'commit', 'author']);
}, 10000);

