import ServiceProvider from '../src/ServiceProvider.js';
import SocketService from '../src/SocketService.js';
import ApiService from '../src/ApiService.js';

describe('Provider instance will build all services', () => {
  const provider = new ServiceProvider();

  test('provider will contain socket service', () => {
    const socket = provider.service('socket');
    expect(socket instanceof SocketService).toBe(true);
  });

  test('provider will contain api service', () => {
    const api = provider.service('api');
    expect(api instanceof ApiService).toBe(true);
  });

  test('will inject get function into all services', () => {
    const providerSocket = provider.service('socket');
    const plainSocket = new SocketService();

    expect(providerSocket.hasOwnProperty('get')).toBe(true);
    expect(plainSocket.hasOwnProperty('get')).toBe(false);
  });

  test('services can call use other services using get', async () => {
    const apiService = provider.service('api');
    const socketService = apiService.get('socket');
    await socketService.start();
    expect(socketService.url()).toEqual(
      'ws://127.1:4000/socket/websocket?vsn=2.0.0'
    );
  });
});
