import SocketHandler from '../../src/core/SocketHandler.js';
import debug from 'debug';

const log = debug('log:test');

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: true
};

let service;
beforeEach(async () => {
  service = new SocketHandler();
});

test('is created correctly', () => {
  expect(Object.keys(service)).toEqual([
    '_socket',
    '_stream',
    '_logger',
    '_channels'
  ]);
});

test('will initialise correctly', async () => {
  await service.init();
});

test('will generate channel instance', async () => {
  const channelName = 'NEW_CHANNEL';
  await service.init();
  const channelHandler = service.channel(channelName);
  expect(channelHandler._name).toEqual(channelName);
  expect(channelHandler._channel.topic).toEqual(channelName);
  expect(channelHandler._channel.state).toEqual('closed');
});
