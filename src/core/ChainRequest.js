import fetch from 'node-fetch';

const url = 'http://localhost:4000';

const request = (route, method = 'GET') => {
  return new Promise(async (resolve, reject) => {
    const result = await fetch(url + route, { method });
    const { status, ...data } = await result.json();
    status === 0 ? resolve(data) : reject(data);
  });
};

export const listAllChains = () => {
  return request(`/chains/`);
};

export const listAllSnapshots = (chainType = 'ganache') => {
  return request(`/chain/snapshots/${chainType}`);
};

// if this chain is not active, the server will throw an error
export const getChainInfo = id => {
  return request(`/chain/${id}`);
};

export const deleteChain = id => {
  return request(`/chain/${id}`, 'DELETE');
};

export const downloadSnapshot = id => {
  return request(`/chain/snapshot/${id}`);
};
