import Client from '../../src/Client';
import ChainManager from '../../src/core/ChainManager';
import SocketService from '../../src/core/SocketService';
import Api from '../../src/core/Api';
import Chain from '../../src/core/Chain';

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: true
};

const buildChainTestInstance = async () => {
  const socket = new SocketService();
  await socket.init();
  const api = new Api();
  const { id } = await socket.push('api', 'start', { ...options });
  const chain = new Chain(id, socket, api);
  return { chain, id };
};

export const buildTestInstance = name => {
  name = name.toLowerCase();
  switch (name) {
    case 'chain':
      return buildChainTestInstance();
    default:
      throw new Error(`Could Not Find Test Instance For ${name}`);
  }
};
