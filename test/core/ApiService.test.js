import ApiService from '../../src/core/ApiService';
import SocketService from '../../src/core/SocketService';

let service, socket;

beforeEach(async () => {
  socket = new SocketService();
  service = new ApiService(socket);
  await service._socket.init();
});

test('service should initialize correctly', async () => {
  await service.init();
  expect(service.connected()).toBe(true);
});

test('service will join channel', async () => {
  let channelObj;
  const name = 'NEW_CHANNEL';
  let promise = new Promise(resolve => {
    channelObj = service.join(name, resolve);
  });
  await promise;
  expect(channelObj.channel.state).toEqual('joined');
  expect(channelObj.channel.topic).toEqual(name);
});
