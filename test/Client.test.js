import Client from '../src/Client';

let client;
beforeEach(() => {
  client = new Client();
});

test('client ', async () => {
  await client.init();
  await client.start();
  await client.socket()._sleep(1000000000);
}, 100000000);
