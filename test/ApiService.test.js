import { get } from '../src/ServiceProvider';
import ApiService from '../src/ApiService';

let socket, service;
beforeEach(() => {
  socket = get('socket');
  socket.start();
  service = new ApiService();
  service.start(socket);
});

test('service will connect to api channel', async () => {
  console.log(service);
});
