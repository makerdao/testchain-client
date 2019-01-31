import ServiceProvider from '../../src/core/ServiceProvider';
import ApiService from '../../src/services/ApiService';

let provider, service;
beforeEach(async () => {
  provider = new ServiceProvider();
  service = provider.service('api');
});

test('service will connect to api channel', async () => {
  console.log(service);
  await service.connect();
});
