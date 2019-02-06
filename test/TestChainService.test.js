import { setupTestMakerInstance, callGanache } from './helpers';
import TestchainService from '../src';
import 'whatwg-fetch';
import debug from 'debug';
import _ from 'lodash';

jest.setTimeout(1000000);

let service;

const log = debug('log:test');

const options = {
  accounts: 3,
  block_mine_time: 0,
  clean_on_stop: true,
  step_id: 1
};

// describe('app connectivity', async () => {
//   beforeEach(async () => {
//     service = new TestchainService();
//   });

//   afterEach(async () => {
//     await service._disconnectApp();
//   });

//   test('will connect & disconnect app', async () => {
//     await service.connectApp();
//     expect(service.isConnectedSocket()).toBe(true);
//     await service._disconnectApp();
//     expect(service.isConnectedSocket()).toBe(false);
//   });

//   test('will throw error for incorrect connection', async () => {
//     expect.assertions(1);
//     try {
//       await service.connectApp('ws://1.1.1.1/socket');
//     } catch (e) {
//       expect(e).toEqual('SOCKET_ERROR');
//     }
//   });

//   test('disconnecting from socket will clear service state', async () => {
//     await service.connectApp();
//     service._chainList['test'] = 1;
//     expect(service._chainList.test).toEqual(1);
//     await service._disconnectApp();
//     expect(service._socket).toEqual(null);
//     expect(service._chainList).toEqual({});
//   });

//   test('will join & leave api channel', async () => {
//     await service.initialize();
//     expect(service.isConnectedApi()).toBe(true);
//     await service._leaveApi();
//     expect(service.isConnectedApi()).toBe(false);
//   });
// });

describe('chain behaviour', async () => {
  beforeEach(async () => {
    service = new TestchainService();
    await service.initialize();
  });

  afterEach(async () => {
    // await service.removeAllChains();
    // await service._disconnectApp();
  });

  test('chain instance can be created', async () => {
    const { id } = await service.createChainInstance({ ...options });
    const chain = service.getChain(id);
    const chainList = service.getChainList();

    expect(chain.channel.topic).toEqual('chain:' + id);
    expect(chain.channel.state).toEqual('joined');
    expect(chain.connected).toEqual(true);
    expect(chain.active).toEqual(true);
    //TODO: change this to haandle multiple chains pre-existing
    // expect(Object.keys(chainList)[0]).toEqual(id);
  });

  // test('initialize should populate chainLists with correct data', async () => {
  //   const chains = await service.fetchChains();
  //   expect(chains.length).toEqual(0);
  //   const { id } = await service.createChainInstance({
  //     ...options,
  //     clean_on_stop: false
  //   });
  //   const chainBeforeDisconnect = service.getChainInfo(id);

  //   await service._disconnectApp();
  //   await service.initialize();
  //   const chainAfterReconnect = service.getChainInfo(id);

  //   expect(_.isEqual(chainBeforeDisconnect, chainAfterReconnect)).toBe(true);
  // });

  // test('chain instance can be stopped', async () => {
  //   const { id } = await service.createChainInstance({
  //     ...options,
  //     clean_on_stop: false
  //   });

  //   await service.stopChain(id);
  //   expect(service.isChainActive(id)).toEqual(false);
  // });

  // test.skip('chain instance can be restarted', async () => {
  //   const { id } = await service.createChainInstance({
  //     ...options,
  //     clean_on_stop: false
  //   });

  //   await service.stopChain(id);
  //   expect(service.getChain(id).active).toEqual(false);
  //   await service.restartChain(id);
  //   expect(service.getChain(id).active).toEqual(true);
  // });

  // test('will create multiple chains', async () => {
  //   const { id: chainId1 } = await service.createChainInstance({ ...options });

  //   const { id: chainId2 } = await service.createChainInstance({
  //     ...options,
  //     http_port: 8546
  //   });

  //   const chain1 = service.getChain(chainId1);
  //   const chain2 = service.getChain(chainId2);

  //   expect(chain1.connected).toBe(true);
  //   expect(chain1.active).toBe(true);
  //   expect(chain2.connected).toBe(true);
  //   expect(chain2.active).toBe(true);
  //   await service.removeAllChains();
  // });

  // test('will throw timeout creating chain instance without options', async () => {
  //   expect.assertions(1);
  //   try {
  //     const { id } = await service.createChainInstance();
  //   } catch (e) {
  //     expect(e).toEqual('ChainCreationError: timeout');
  //   }
  // });

  // test('will throw error when stopping chain with wrong id', async () => {
  //   const { id } = await service.createChainInstance({
  //     ...options,
  //     clean_on_stop: false
  //   });
  //   const wrongId = 'wrongId';

  //   expect.assertions(1);
  //   try {
  //     await service.stopChain(wrongId);
  //   } catch (e) {
  //     expect(e).toEqual(`No chain with ID ${wrongId}`);
  //   }
  // });
});

// describe('chain removal', async () => {
//   let chainId;

//   beforeEach(async () => {
//     service = new TestchainService();
//     await service.initialize();
//   });

//   afterEach(async () => {
//     await service.removeAllChains();
//     await service._disconnectApp();
//   });

//   test('chain with clean_on_stop:true will remove chain when stopped', async () => {
//     expect.assertions(2);
//     const { id } = await service.createChainInstance({
//       ...options
//     });

//     expect(await service.chainExists(id)).toBe(true);
//     await service.stopChain(id);
//     expect(await service.chainExists(id)).toBe(false);
//   });

//   test('chain with clean_on_stop:false will not remove chain when stopped', async () => {
//     const { id } = await service.createChainInstance({
//       ...options,
//       clean_on_stop: false
//     });

//     expect(await service.chainExists(id)).toBe(true);
//     await service.stopChain(id);
//     expect(await service.chainExists(id)).toBe(true);
//   });

//   test('chain with clean_on_stop:false will be removed by fetchDelete', async () => {
//     const { id } = await service.createChainInstance({
//       ...options,
//       clean_on_stop: false
//     });
//     await service.stopChain(id);
//     expect(await service.chainExists(id)).toBe(true);
//     expect(service.isChainActive(id)).toBe(false);
//     await service.fetchDelete(id);
//     expect(await service.chainExists(id)).toBe(false);
//   });

//   test('chain will fail deletion by fetchDelete if active', async () => {
//     expect.assertions(1);
//     const { id } = await service.createChainInstance({ ...options });
//     try {
//       await service.fetchDelete(id);
//     } catch (e) {
//       expect(e).toEqual(`Chain Could Not Be Deleted`);
//     }
//   });

//   test('fetchDelete will throw error if attempt to delete active chain is made', async () => {
//     expect.assertions(4);
//     const { id } = await service.createChainInstance({
//       ...options,
//       clean_on_stop: false
//     });

//     expect(await service.chainExists(id)).toBe(true);
//     expect(service.isChainActive(id)).toBe(true);

//     try {
//       await service.fetchDelete(id);
//     } catch (e) {
//       expect(e).toEqual('Chain Could Not Be Deleted');
//       expect(await service.chainExists(id)).toBe(true);
//     }
//   });

//   test('removeAllChains will remove all chains', async () => {
//     await service.createChainInstance({ ...options });
//     await service.createChainInstance({ ...options });

//     let chainList = await service.fetchChains();
//     expect(chainList.length).toEqual(2);

//     await service.removeAllChains();
//     chainList = await service.fetchChains();
//     expect(chainList.length).toEqual(0);
//   });
// });

// describe('snapshot examples', async () => {
//   beforeEach(async () => {
//     service = new TestchainService();
//     await service.initialize();
//   });

//   afterEach(async () => {
//     await service.removeAllChains();
//     await service._disconnectApp();
//   });

//   // test('will take a snapshot of the chain', async () => {
//   //   const { id } = await service.createChainInstance({ ...options });

//   //   const description = 'Jest takeSnapshot';
//   //   const label = `{"snap":"${id}","desc":"${description}"}`;
//   //   const snapId = await service.takeSnapshot({ chainId: id, description });
//   //   console.log('snapId in test', snapId);
//   //   const snapshot = service.getSnap(snapId);
//   //   console.log('snapshot in test', snapshot);

//   //   const delay = Date.now() - new Date(snapshot.date).getTime();
//   //   expect(delay).toBeLessThan(2000); // roughly current time
//   //   expect(snapshot.description).toEqual(label);
//   //   expect(snapshot.id).toEqual(snapId);
//   //   expect(snapshot.chainId).toEqual(id);
//   //   expect(snapshot.path).toBeTruthy();
//   // });

//   // test('will restore snapshot of the chain', async () => {
//   //   const { id } = await service.createChainInstance({
//   //     ...options
//   //   });

//   //   const description = 'Jest restoreSnapshot';
//   //   const label = `{"snap":"${id}","desc":"${description}"}`;
//   //   const snapId = await service.takeSnapshot({ chainId: id, description });

//   //   const res = await service.restoreSnapshot(snapId);

//   //   console.log('snap res in test', res);

//   //   expect(res.id).toBe(snapId);
//   //   expect(res.description).toBe(label);
//   // });

//   // test('will list snapshots for a chain', async () => {
//   //   const { id } = await service.createChainInstance({ ...options });

//   //   const description = 'Jest listSnapshots';
//   //   const snapshotId = await service.takeSnapshot({ chainId: id, description });
//   //   const snapshots = await service.fetchSnapshots();

//   //   const targetSnapshot = snapshots.find(
//   //     snapshot => snapshot.id === snapshotId
//   //   );

//   //   expect(snapshots.length > 0).toBe(true);
//   //   expect(targetSnapshot.description).toBe(description);
//   // });
// });
