import SocketService from '../../src/core/SocketService';
import ChainManager from '../../src/core/ChainManager';
import { getChainInfo } from '../../src/core/ChainRequest';

let socket, api, service, id, chain;

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
});

test('service will create chain instance', async () => {
  id = await service.createChain({ ...options });
  const { details } = await getChainInfo(id);
  expect(details.id).toEqual(id);
});

// test.only('service will stop chain instance', async () => {
//   id = await service.createChain({ ...options });
//   chain = service.chain(id).details();
//   expect(chain.status).toBe('active');
//   await service.chain(id).stop();
//   chain = service.chain(id).details();
//   console.log(chain);
// });
