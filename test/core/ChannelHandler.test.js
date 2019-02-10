import ChannelHandler from '../../src/core/ChannelHandler';
import SocketHandler from '../../src/core/SocketHandler';

let service, socketHandler, socket;

const channelName = 'NEW_CHANNEL';

beforeEach(async () => {
  socketHandler = new SocketHandler();
  await socketHandler.init();
  socket = socketHandler._socket;
  service = new ChannelHandler(channelName, socket);
});

test('is created correctly', () => {
  expect(service._name).toEqual(channelName);
  expect(service._socket).toBeDefined();
  expect(service._channel.state).toEqual('closed');
});

test('will initialise correctly', async () => {
  await service.init();
  expect(service._channel.state).toEqual('joined');
});
