import ApiService from '../../src/core/ApiService';
import SocketService from '../../src/core/SocketService';

let service, socket;

beforeEach(async () => {
  socket = new SocketService();
  service = new ApiService(socket);
  await service._socket.init();
});

test('service should initialize correctly', async () => {
  const msg = await service.init();
  expect(msg).toEqual('Welcome to ExTestchain !');
  expect(service.connected()).toBe(true);
});

test('service can leave api channel', async () => {
  await service.init();
  await service.leave();
  expect(service.connected()).toBe(false);
});

test('service will join channel', async () => {
  let _channel;
  const name = 'NEW_CHANNEL';
  let promise = new Promise(resolve => {
    service.join(name, ({ channel }) => {
      _channel = channel;
      resolve();
    });
  });
  await promise;
  expect(_channel.state).toEqual('joined');
  expect(_channel.topic).toEqual(name);
});
