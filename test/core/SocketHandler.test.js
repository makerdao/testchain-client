import SocketHandler from '../../src/core/SocketHandler.js';
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
  service = new SocketHandler();
});

test.only('mock1', async () => {
  const promise = service.resolveOnEvent('socket_open');
  service.init();
  await promise;
  console.log('sss');

  await service._sleep(5000);
});

test('service will create channel and add it to list', async () => {
  service.init();
  expect(service._channels[name]).toBe(undefined);
  const channel = service.channel(name);
  expect(isEqual(channel, service._channels[name])).toBe(true);
  expect(channel.topic).toEqual(name);
});

// test('service will join channel', async () => {
//   service.channel(name);
//   await service.join(name);
//   expect(service.channel(name).state === 'joined');
// });

// test('service will push to channel', async () => {
//   service.channel('api');
//   await service.join('api');
//   const { chains } = await service.push('api', 'list_chains', { ...options });
//   expect(Array.isArray(chains)).toBe(true);
// });
