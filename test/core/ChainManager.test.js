import SocketService from '../../src/core/SocketService.js';
import ApiService from '../../src/core/ApiService';
import ChainManager from '../../src/core/ChainManager';

describe('ChainManager', () => {
  let socket, api, service, id, chain;

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
    await service.init();
  });

  test('service will create chain instance', async () => {
    id = await service.createChain({ ...options });
    const { details } = await service.requestChain(id);
    expect(details.id).toEqual(id);
  });

  test('service will delete chain instance', async () => {});

  test('service can send request get all existing chains', async () => {
    await service.createChain({ ...options });
    const { list } = await service.requestAllChains();
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  // test('chain manager will create chain instance', async () => {
  //   const chain = await service.createChain({ ...options });
  //   console.log(chain);
  // });
});
