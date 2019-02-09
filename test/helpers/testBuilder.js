import SocketHandler from '../../src/core/SocketHandler';
import Api from '../../src/core/Api';
import Chain from '../../src/core/Chain';

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: false
};

const buildChannelHandlerTestInstance = async () => {
  const socket = new SocketHandler();
  await socket.init();
};

export const buildTestInstance = name => {
  name = name.toLowerCase();
  switch (name) {
    case 'channelhandler':
      return buildChannelHandlerTestInstance();
    default:
      throw new Error(`Could Not Find Test Instance For ${name}`);
  }
};
