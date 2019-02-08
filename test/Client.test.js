import Client from '../src/Client';

let client;
beforeEach(() => {
  client = new Client();
});

test('client ', async () => {
  console.log(client);
});
