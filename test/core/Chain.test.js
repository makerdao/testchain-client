import SocketService from '../../src/core/SocketService';
import Api from '../../src/core/Api';
import Chain from '../../src/core/Chain';
import { buildTestInstance } from '../helpers/testBuilder.js';

let service, id;

beforeEach(async () => {
  const { chain, id: _id } = await buildTestInstance('Chain');
  service = chain;
  id = _id;
});

test('service should be created correctly', async () => {
  expect(service.constructor).toEqual(Chain);
  expect(service._socket.constructor).toEqual(SocketService);
  expect(service._api.constructor).toEqual(Api);
  expect(service.id).toEqual(id);
  expect(service.name).toEqual(`chain:${id}`);
  expect(service.snapshots).toEqual({});
  expect(await service.active()).toBeFalsy();
});

test('service should initialise correctly', async () => {
  await service.init();
  expect(await service.active()).toBeTruthy();
});
