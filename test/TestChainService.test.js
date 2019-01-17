import { setupTestMakerInstance, callGanache } from './helpers';
import TestchainService from '../src';
import 'whatwg-fetch';
import debug from 'debug';
import _ from 'lodash';

jest.setTimeout(10000);

let service;

const log = debug('log:test');

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: true
};

// test.only('will remove all chains', async () => {
//   service = new TestchainService();
//   await service.initialize();
//   await service.removeAllChains();
// });

describe('app connectivity', async () => {
  beforeEach(async () => {
    service = new TestchainService();
  });

  test('will connect & disconnect app', async () => {
    await service.connectApp();
    expect(service.isConnectedSocket()).toBe(true);
    service._disconnectApp();
    expect(service.isConnectedSocket()).toBe(false);
  });

  test('will throw error for incorrect connection', async () => {
    expect.assertions(1);
    try {
      await service.connectApp('ws://1.1.1.1/socket');
    } catch (e) {
      expect(e).toEqual('SOCKET_ERROR');
    }
  });

  test('disconnecting from socket will clear service state', async () => {
    await service.connectApp();
    service._chainList['test'] = 1;
    expect(service._chainList.test).toEqual(1);
    service._disconnectApp();
    expect(service._socket).toEqual(null);
    expect(service._chainList).toEqual({});
  });

  test('will join & leave api channel', async () => {
    await service.initialize();
    expect(service.isConnectedApi()).toBe(true);
    await service._leaveApi();
    expect(service.isConnectedApi()).toBe(false);
  });
});

describe('chain behaviour', async () => {
  beforeEach(async () => {
    service = new TestchainService();
    await service.initialize();
  });

  afterEach(async () => {
    await service.removeAllChains();
  });

  test('chain instance can be created', async () => {
    const { id } = await service.createChainInstance({ ...options });
    const chain = service.getChain(id);
    const chainList = service.getChainList();

    expect(chain.channel.topic).toEqual('chain:' + id);
    expect(chain.channel.state).toEqual('joined');
    expect(chain.connected).toEqual(true);
    expect(chain.active).toEqual(true);
    expect(Object.keys(chainList)[0]).toEqual(id);
  });

  test('initialize should populate chainLists with correct data', async () => {
    const chains = await service.listChains();
    expect(chains.length).toEqual(0);
    const { id } = await service.createChainInstance({
      ...options,
      clean_on_stop: false
    });
    const chainBeforeDisconnect = service.getChainInfo(id);

    service._disconnectApp();
    await service.initialize();
    const chainAfterReconnect = service.getChainInfo(id);

    expect(_.isEqual(chainBeforeDisconnect, chainAfterReconnect)).toBe(true);
  });

  test('chain instance can be stopped', async () => {
    const { id } = await service.createChainInstance({
      ...options,
      clean_on_stop: false
    });

    await service.stopChain(id);
    expect(service.isChainActive(id)).toEqual(false);
  });

  test('chain instance can be restarted', async () => {
    const { id } = await service.createChainInstance({
      ...options,
      clean_on_stop: false
    });

    await service.stopChain(id);
    expect(service.getChain(id).active).toEqual(false);
    await service.restartChain(id);
    expect(service.getChain(id).active).toEqual(true);
  });

  test('will create multiple chains', async () => {
    const { id: chainId1 } = await service.createChainInstance({ ...options });

    const { id: chainId2 } = await service.createChainInstance({
      ...options,
      http_port: 8546
    });

    const chain1 = service.getChain(chainId1);
    const chain2 = service.getChain(chainId2);

    expect(chain1.connected).toBe(true);
    expect(chain1.active).toBe(true);
    expect(chain2.connected).toBe(true);
    expect(chain2.active).toBe(true);
  });

  test('will throw timeout creating chain instance without options', async () => {
    expect.assertions(1);
    try {
      const { id } = await service.createChainInstance();
    } catch (e) {
      expect(e).toEqual('ChainCreationError: timeout');
    }
  });

  test.skip('will throw error when stopping chain with wrong id', async () => {
    const { id } = await service.createChainInstance({
      ...options,
      clean_on_stop: false
    });

    await service.stopChain();
  });
});

describe('snapshot examples', async () => {
  beforeEach(async () => {
    service = new TestchainService();
    await service.initialize();
  });

  afterEach(async () => {
    await service.removeAllChains();
  });

  test('will take a snapshot of the chain', async () => {
    const { id } = await service.createChainInstance({ ...options });

    const description = 'NEW_SNAPSHOT';
    const snapId = await service.takeSnapshot(id, description);
    const snapshot = service.getSnap(snapId);

    const delay = Date.now() - new Date(snapshot.date).getTime();
    expect(delay).toBeLessThan(2000); // roughly current time
    expect(snapshot.description).toEqual(description);
    expect(snapshot.id).toEqual(snapId);
    expect(snapshot.chainId).toEqual(id);
    expect(snapshot.path).toBeTruthy();
  });

  test('will restore snapshot of the chain', async () => {
    const { id } = await service.createChainInstance({
      ...options
    });
    const chainUrl = service.getChain(id).rpc_url;

    let maker, contract;
    maker = await setupTestMakerInstance(3, chainUrl);
    const description = 'BEFORE_CONTRACTS';
    const snapId = await service.takeSnapshot(id, description);

    const snapshot = service.getSnap(snapId);

    expect(() => {
      contract = maker.service('smartContract').getContractByName('CHIEF');
    }).toThrow();

    maker = await setupTestMakerInstance(2, chainUrl); // maker with contracts deployed
    contract = maker.service('smartContract').getContractByName('CHIEF');
    expect(/^(0x)?[0-9a-f]{40}$/i.test(contract.address)).toBe(true);

    const res = await service.revertSnapshot(snapId);
    expect(res.description).toEqual(description);
    expect(res.date).toEqual(snapshot.date);
    expect(res.id).toEqual(snapshot.id);
    expect(res.path).toEqual(snapshot.path);

    maker = await setupTestMakerInstance(3, chainUrl);
    expect(() => {
      contract = maker.service('smartContract').getContractByName('CHIEF');
    }).toThrow();
  });
});
