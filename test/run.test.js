import Client from '../src/Client.js';

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: false
};

test('creating multiple chains', async () => {
  const client = new Client();
  await client.init();

  await client.create({ ...options });
  await client.create({ ...options });
  await client.create({ ...options });
  await client.create({ ...options });
  await client.create({ ...options });
  await client.create({ ...options });
});
