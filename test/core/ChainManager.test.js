import SocketService from '../../src/core/SocketService';
import ChainManager from '../../src/core/ChainManager';
import {
  listAllChains,
  listAllSnapshots,
  getBlockNumber,
  mineBlock
} from '../../src/core/ChainRequest';

jest.setTimeout(10000);
let socket, service, chain, response, block;

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: false
};

beforeEach(async () => {
  socket = new SocketService();
  service = new ChainManager(socket);
  await socket.init();
  await service.init();
  id = await service.createChain({ ...options });
});

afterEach(async () => {
  await service.clean();
});

test('service will create chain instance', async () => {
  chain = service.chain(id);
  expect(chain.id).toEqual(id);
  expect(chain.name).toEqual(`chain:${id}`);
  expect(chain.active).toBe(true);
  expect(chain.accounts.length).toBe(options.accounts + 1);
});

test('service will stop chain instance', async () => {
  expect(service.chain(id).active).toBe(true);
  await service.chain(id).stop();
  expect(service.chain(id).active).toBe(false);
});

test('service will restart chain instance', async () => {
  await service.chain(id).stop();
  expect(service.chain(id).active).toBe(false);
  await service.chain(id).start();
  chain = service.chain(id);
  expect(chain.active).toBe(true);
  expect(chain.accounts.length).toBe(options.accounts + 1);
});

test('service will check existence of chain', async () => {
  const id = await service.createChain({ ...options });
  expect(await service.exists(id)).toBeTruthy();
  const badId = new Array(20).join('1');
  expect(await service.exists(badId)).toBeFalsy();
});

test('service will delete chain instance when clean_on_stop is true', async () => {
  const id = await service.createChain({ ...options, clean_on_stop: true });
  expect(await service.exists(id)).toBeTruthy();
  await service.removeChain(id);
  expect(await service.exists(id)).toBeFalsy();
});

test('service will delete chain instance when clean_on_stop is false', async () => {
  const id = await service.createChain({ ...options });
  expect(await service.exists(id)).toBeTruthy();
  await service.removeChain(id);
  expect(await service.exists(id)).toBeFalsy();
});

test('service will clean all chains', async () => {
  const id1 = await service.createChain({ ...options, clean_on_stop: true });
  const id2 = await service.createChain({ ...options });
  const id3 = await service.createChain({ ...options });

  await service.clean();

  expect(await service.exists(id1)).toBeFalsy();
  expect(await service.exists(id2)).toBeFalsy();
  expect(await service.exists(id3)).toBeFalsy();
});

test('service will take a snapshot of the chain', async () => {
  const id = await service.createChain({ ...options });
  const snapshotDescription = 'SNAPSHOT_1';
  const snapshotId = await service.chain(id).takeSnapshot(snapshotDescription);
  const snapshot = service.chain(id).snapshot(snapshotId);

  expect(snapshot.description).toEqual(snapshotDescription);
});

test("service will revert a snapshot back to it's original state", async () => {
  /*
   * Test Failing:
   * Will receive a FetchError ECONNRESET on the POST requests to the server.
   * These only fail due to the occurring takeSnapshot() which seem to cause
   * the http endpoint to disconnect/fail.
   */

  const { http_port } = await service.chain(id).details();

  const snapshotDescription = 'BEFORE_MINE';
  const snapshotId = await service.chain(id).takeSnapshot(snapshotDescription);

  await service.chain(id).start();

  response = await getBlockNumber(http_port);
  block = parseInt(response.result, 16);
  expect(block).toEqual(0);

  await mineBlock(http_port);
  response = await getBlockNumber(http_port);
  block = parseInt(response.result, 16);
  expect(block).toEqual(1);

  await service.chain(id).revertSnapshot(snapshotId);

  response = await getBlockNumber(http_port);
  block = parseInt(response.result, 16);
  expect(block).toEqual(0);
});
