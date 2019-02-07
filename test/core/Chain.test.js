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

describe('Creating a chain', () => {
  test('should be created correctly', async () => {
    expect(service.constructor).toEqual(Chain);
    expect(service._socket.constructor).toEqual(SocketService);
    expect(service._api.constructor).toEqual(Api);
    expect(service.id).toEqual(id);
    expect(service.name).toEqual(`chain:${id}`);
    expect(await service.active()).toBeFalsy();
    expect(service.snapshots).toEqual({});
    expect(service.info).toEqual({});
    expect(service.config).toEqual({});
    expect(service.user).toEqual({});
  });

  test('active() should only return false as chain is not initialised yet', async () => {
    service._updateInfo = jest.fn();
    expect(await service.active()).toBeFalsy();
    expect(service._updateInfo).not.toHaveBeenCalled();
  });
});

describe('Initialising a chain', () => {
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

  test('active() will call updateInfo and return true if chain is active', async () => {
    await service.init();
    service._updateInfo = jest.fn();
    expect(await service.active()).toBeTruthy();
    expect(service._updateInfo).toHaveBeenCalled();
  });
});

describe('Stopping a chain', () => {
  beforeEach(async () => {
    await service.init();
  });

  test('stop() will stop an active chain', async () => {
    expect(await service.active()).toBeTruthy();
    await service.stop();
    expect(await service.active()).toBeFalsy();
  });

  test('stop() will not call socket.push() unless chain is active', async () => {
    service.active = jest.fn(async () => false);
    service._socket.push = jest.fn();
    await service.stop();
    expect(service._socket.push).not.toHaveBeenCalled();
  });

  test('stop() will call socket.push() when chain is active', async () => {
    service.active = jest.fn(async () => true);
    service._socket.push = jest.fn();
    await service.stop();
    expect(service._socket.push).toHaveBeenCalled();
  });

  test('stop() will call _updateInfo() when chain is active and cleanOnStop is false', async () => {
    expect(await service.active()).toBeTruthy();
    service._willCleanOnStop = jest.fn(() => false);
    service._updateInfo = jest.fn();
    await service.stop();
    expect(service._willCleanOnStop).toHaveBeenCalled();
    expect(service._updateInfo).toHaveBeenCalled();
  });

  test('stop() will call constructor() when chain is active and cleanOnStop is true', async () => {
    expect(await service.active()).toBeTruthy();
    service._willCleanOnStop = jest.fn(() => true);
    service.constructor = jest.fn();
    await service.stop();
    expect(service._willCleanOnStop).toHaveBeenCalled();
    expect(service.constructor).toHaveBeenCalled();
  });

  test('stop() will reset the class when chain is active and cleanOnStop is true', async () => {
    await service.init();
    expect(await service.active()).toBeTruthy();
    service._willCleanOnStop = jest.fn(() => true);
    await service.stop();
    expect(await service.active()).toBeFalsy();
    expect(service.snapshots).toEqual({});
    expect(service.info).toEqual({});
    expect(service.config).toEqual({});
    expect(service.user).toEqual({});
  });
});

describe('Starting a chain', async () => {
  beforeEach(async () => {
    await service.init();
    await service.stop();
  });

  test('start() will start an inactive chain', async () => {
    expect(await service.active()).toBeFalsy();
    await service.start();
    expect(await service.active()).toBeTruthy();
  });

  test('start() will call socket.push() if chain is inactive', async () => {
    service.active = jest.fn(async () => false);
    service._socket.push = jest.fn();
    await service.start();
    expect(service._socket.push).toHaveBeenCalled();
  });

  test('start() will not call socket.push() if chain is active', async () => {
    service.active = jest.fn(async () => true);
    service._socket.push = jest.fn();
    await service.start();
    expect(service._socket.push).not.toHaveBeenCalled();
  });
});
