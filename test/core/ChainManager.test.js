import SocketService from '../../src/core/SocketService';
import ChainManager from '../../src/core/ChainManager';
import { listAllChains } from '../../src/core/ChainRequest';

let socket, service, id, chain, exists;

socket = new SocketService();

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: false
};

beforeEach(async () => {
  service = new ChainManager(socket);

  await socket.init();
  await service.init();
  id = await service.createChain({ ...options });
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
  exists = await service.exists(id);
  expect(exists).toBe(true);
  id = new Array(20).join('1');
  exists = await service.exists(id);
  expect(exists).toBe(false);
});
