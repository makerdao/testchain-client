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

test('should be created correctly', async () => {
  expect(service.constructor).toEqual(Chain);
  expect(service._socket.constructor).toEqual(SocketService);
  expect(service._api.constructor).toEqual(Api);
  expect(service.id).toEqual(id);
  expect(service.name).toEqual(`chain:${id}`);
  expect(service.snapshots).toEqual({});
  expect(await service.active()).toBeFalsy();
});

test('init() will work correctly', async () => {
  await service.init();
  expect(await service.active()).toBeTruthy();
  const details = service.details();
  expect(Object.keys(details)).toEqual([
    'id',
    'name',
    'active',
    'info',
    'config',
    'user'
  ]);

  const { info, config, user } = details;
  expect(Object.keys(info)).toEqual([
    'status',
    'start',
    'notify_pid',
    'id',
    'deploy_step',
    'deploy_hash',
    'deploy_data',
    'chain_status'
  ]);

  expect(Object.keys(config)).toEqual([
    'type',
    'step_id',
    'snapshot_id',
    'id',
    'description',
    'clean_on_stop',
    'block_mine_time',
    'accounts'
  ]);

  expect(Object.keys(user)).toEqual([
    'ws_url',
    'rpc_url',
    'id',
    'gas_limit',
    'coinbase',
    'accounts'
  ]);

  expect(user.accounts.length).toEqual(config.accounts + 1);
});

test('init() will call populate()', async () => {
  service.populate = jest.fn();
  await service.init();
  expect(service.populate).toHaveBeenCalled();
});

test('stop() will stop an an active chain', async () => {
  await service.init();
  expect(await service.active()).toBeTruthy();
  await service.stop();
  expect(await service.active()).toBeFalsy();
});

test("stop() will not attempt to push 'stop' event unless chain is active", async () => {
  await service.init();
  service.active = jest.fn(async () => {
    return false;
  });
  service._socket.push = jest.fn();
  await service.stop();
  expect(service.active).toHaveBeenCalled();
  expect(service._socket.push).not.toHaveBeenCalled();
});
