import Client from '../src/Client.js';

let client;
beforeEach(() => {
  client = new Client();
});

test('client initialises correctly', async () => {
  await client.init();
  expect(client._socketService.connected()).toBe(true);
  expect(client._apiService.connected()).toBe(true);
});
