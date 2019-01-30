import ServiceProvider from '../src/core/ServiceProvider';
import ApiService from '../src/ApiService';

let provider, service;
beforeEach(() => {
  provider = new ServiceProvider();
  service = provider.service('api');
});

test('service can use socket service', async () => {
  //  expect(service._socket).
});
