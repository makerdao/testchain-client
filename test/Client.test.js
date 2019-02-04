import Client from '../src/Client';

let client;
beforeEach(() => {
  client = new Client();
});

test('client initializes correctly', async () => {
  await client.init();
  expect(client._socketService.connected()).toBe(true);
  expect(client._chainMgr.connected()).toBe(true);
});
