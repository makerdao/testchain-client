import Client from '../src/Client';
import SocketHandler from '../src/core/SocketHandler';
import Api from '../src/core/Api';

import { find, isEqual } from 'lodash';

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: false
};

let client;
beforeEach(() => {
  client = new Client();
});

afterEach(async () => {
  // const { data: list } = await client.api().listAllChains();

  //list.forEach(async ({ id }) => {
  //  await client.delete(id);
  //});
});

test('client will be created correctly', () => {
  expect(client.socket() instanceof SocketHandler).toBeTruthy();
  expect(client.api() instanceof Api).toBeTruthy();
});

test('client will initialise socket connection', async () => {
  expect(client.socket().connected()).toBeFalsy();
  await client.init();
  expect(client.socket().connected()).toBeTruthy();
  expect(Object.keys(client.channels())[0]).toEqual('api');
  expect(client.channel('api').joined()).toBeTruthy();
});

test.only('client will create a normal chain instance', async () => {
  await client.init();

  const chainEventData = await client.create({ ...options });
  console.log(chainEventData);
}, (10 * 1000));

test('client will create a chain instance with deployments', async () => {
  await client.init();

  const chainEventData = await client.create({ ...options, step_id: 1 });
  console.log(chainEventData);
}, (3 * 60 * 1000)); // this test does take 2.5 - 3 minutes

test('client will stop a chain', async () => {
  await client.init();
  client.create({ ...options });
  const { response } = await client.once('api', 'phx_reply');
  const { id } = response;
  await client.once(id, 'started');

  const chainBeforeStop = await client.api().getChain(id);
  expect(chainBeforeStop.details.status).toEqual('ready');

  client.stop(id);
  const x = () => {
    return new Promise(async resolve => {
      const res = await client.once(id, 'status_changed');
      if (res.data === 'terminated') {
        resolve();
      }
      await x();
    });
  };

  await x();

  console.log(await client.api().getChain(id));

  const chainAfterStop = await client.api().getChain(id);
  console.log(chainAfterStop);
  expect(chainAfterStop.details.status).toEqual('terminated');
}, 10000);

test('client will restart a stopped chain', async () => {
  await client.init();
  const { id } = await client.create({ ...options });
  await client.stop(id);

  const chainBeforeRestart = await client.api().getChain(id);
  expect(chainBeforeRestart.details.status).toEqual('terminated');

  await client.restart(id);

  const chainAfterRestart = await client.api().getChain(id);
  expect(chainAfterRestart.details.status).toEqual('ready');
});

test('client can delete a chain', async () => {
  await client.init();
  const { id } = await client.create({ ...options });

  const { data: list1 } = await client.api().listAllChains();
  expect(find(list1, { id })).toBeDefined();

  await client.delete(id);

  const { data: list2 } = await client.api().listAllChains();
  expect(find(list2, { id })).not.toBeDefined();
});

test('client can take a snapshot', async () => {
  await client.init();
  const { id } = await client.create({ ...options });

  const snapshotDescription = 'SNAPSHOT';
  const { description, id: snapId } = await client.takeSnapshot(
    id,
    snapshotDescription
  );
  expect(snapshotDescription).toEqual(description);

  const { data: list } = await client.api().listAllSnapshots();
  expect(find(list, { id: snapId })).toBeDefined();
});

test('client can restore a snapshot', async () => {
  await client.init();
  const { id, rpc_url } = await client.create({ ...options });

  const arr = rpc_url.split(':');
  const url = 'http://localhost';
  const port = arr[2];

  const block = async () => {
    const { result: blockNumber } = await client
      .api()
      .getBlockNumber(url, port);
    return parseInt(blockNumber, 16);
  };

  expect(await block()).toEqual(0);
  const { id: snapshotId } = await client.takeSnapshot(id);

  await client.socket()._sleep(60000);

  await client.api().mineBlock(url, port);
  expect(await block()).toEqual(1);

  await client.socket()._sleep(60000);

  const res = await client.restoreSnapshot(id, snapshotId);
  expect(await block()).toEqual(0);
}, 120000);
