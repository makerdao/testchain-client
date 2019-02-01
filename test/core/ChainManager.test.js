import SocketService from '../../src/core/SocketService.js';
import ApiService from '../../src/core/ApiService';
import ChainManager from '../../src/core/ChainManager';

let socket, api, service;

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: false
};

beforeEach(async () => {
  socket = new SocketService();
  api = new ApiService(socket);
  service = new ChainManager(api);

  await socket.init();
  await api.init();
});

test.only('service will initialize correctly', async () => {
  service.createChain({ ...options });
  await service.init();
});

test('chain manager will create chain instance', async () => {
  const chain = await service.createChain({ ...options });
  console.log(chain);
});
