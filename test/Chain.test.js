import Chain from '../src/Chain.js';
import SocketService from '../src/SocketService.js';
import ApiService from '../src/ApiService.js';

let chain = new Chain();

test('chain can access all services', () => {
  expect(chain.service('socket') instanceof SocketService).toBe(true);
  expect(chain.service('api') instanceof ApiService).toBe(true);
});

test('chain initialize opens socket connection', async () => {
  await chain.initialize();
  expect(chain.service('socket').connected());
});
