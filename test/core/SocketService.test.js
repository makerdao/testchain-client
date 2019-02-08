import Socket from '../../src/core/Socket.js';
import { isEqual } from 'lodash';
import debug from 'debug';

const log = debug('log:test');
let service;
const name = 'NEW_CHANNEL';

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: true
};

beforeEach(async () => {
  service = new Socket();
  await service.init('ws://127.1:4000/socket');
});

test('service will initialize correctly', async () => {
  expect(service.connected()).toBe(true);
  expect(!!service._event).toBe(true);
});

test('service will fail to initialize with incorrect url', async () => {
  expect.assertions(2);
  const incorrectUrl = 'ws://a.a.a.a:4000/socket';

  try {
    await service.init(incorrectUrl);
  } catch (e) {
    expect(e).toEqual('Socket Failed To Connect');
  }
  expect(service.connected()).toBe(false);
});

test('service will disconnect', async () => {
  expect(service.connected()).toBe(true);
  await service.disconnect();
  expect(service.connected()).toBe(false);
});

test('service will create channel and add it to list', async () => {
  expect(service._channels[name]).toBe(undefined);
  const channel = service.channel(name);
  expect(isEqual(channel, service._channels[name])).toBe(true);
  expect(channel.topic).toEqual(name);
});

test('service will join channel', async () => {
  service.channel(name);
  await service.join(name);
  expect(service.channel(name).state === 'joined');
});

test('service will push to channel', async () => {
  service.channel('api');
  await service.join('api');
  const { chains } = await service.push('api', 'list_chains', { ...options });
  expect(Array.isArray(chains)).toBe(true);
});
