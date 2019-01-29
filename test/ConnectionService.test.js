import ConnectionService from '../src/ConnectionService.js';

describe('Connection Service', async () => {
  let service;
  const correctUrl = 'ws://127.1:4000/socket';
  const incorrectUrl = 'ws://a.a.a.a:4000/socket';
  beforeEach(() => {
    service = new ConnectionService();
  });

  test('service will connect to socket', async () => {
    service._socketUrl = correctUrl;
    await service.connect();
    expect(service.socket().isConnected()).toBe(true);
  });

  test('service with wrong url will fail to connect to socket', async () => {
    expect.assertions(2);
    service._socketUrl = incorrectUrl;
    try {
      await service.connect();
    } catch (e) {
      expect(e).toEqual('Socket Failed To Connect');
    }
    expect(service.socket().isConnected()).toBe(false);
  });
});
