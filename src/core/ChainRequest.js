import fetch from 'node-fetch';

const api_port = '4000';
const url = 'http://localhost:';

const request = (route, method, port = api_port, body = {}) => {
  return new Promise(async (resolve, reject) => {
    let result;
    if (method === 'GET') {
      result = await fetch(url + port + route, { method });
    } else {
      result = await fetch(url + port + route, { method, body });
    }
    const { status, ...data } = await result.json();
    !status ? resolve(data) : reject(data);
  });
};

export const listAllChains = () => {
  return request(`/chains/`, 'GET');
};

export const listAllSnapshots = (chainType = 'ganache') => {
  return request(`/chain/snapshots/${chainType}`, 'GET');
};

// if this chain is not active, the server will throw an error
export const getChainInfo = id => {
  return request(`/chain/${id}`, 'GET');
};

export const deleteChain = id => {
  return request(`/chain/${id}`, 'DELETE');
};

export const downloadSnapshot = id => {
  return request(`/chain/snapshot/${id}`, 'GET');
};

export const getBlockNumber = port => {
  return request(
    '/',
    'POST',
    port,
    '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
  );
};

export const mineBlock = port => {
  return request(
    '/',
    'POST',
    port,
    '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}'
  );
};
