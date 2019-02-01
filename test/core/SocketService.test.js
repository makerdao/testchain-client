import SocketService from '../../src/core/SocketService.js';

let service;

beforeEach(() => {
  service = new SocketService();
});

test('service will initialize correctly', async () => {
  await service.init();
  expect(service.connected()).toBe(true);
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
  await service.init();
  expect(service.connected()).toBe(true);
  await service.disconnect();
  expect(service.connected()).toBe(false);
});
