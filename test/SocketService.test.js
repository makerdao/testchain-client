import SocketService from '../src/SocketService.js';

let service;
const incorrectUrl = 'ws://a.a.a.a:4000/socket';

beforeEach(() => {
  service = new SocketService();
});

test('service will connect to socket', async () => {
  await service.connect();
  expect(service.connected()).toBe(true);
});

test('service with wrong url will fail to connect to socket', async () => {
  expect.assertions(2);
  service._socketUrl = incorrectUrl;
  try {
    await service.connect(incorrectUrl);
  } catch (e) {
    expect(e).toEqual('Socket Failed To Connect');
  }
  expect(service.connected()).toBe(false);
});

test('service will disconnect', async () => {
  await service.connect();
  expect(service.connected()).toBe(true);
  await service.disconnect();
  expect(service.connected()).toBe(false);
});

test('service will connect on initialize', async () => {
  await service.initialize();
  expect(service.connected()).toBe(true);
});
