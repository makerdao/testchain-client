import SocketHandler from '../../src/core/SocketHandler';
import { Socket } from 'phoenix';
import Observable from 'zen-observable';

let socketHandler;

beforeEach(() => {
  socketHandler = new SocketHandler();
});

test('socketHander will be created correctly', () => {
  expect(socketHandler._socket).toBeInstanceOf(Socket);
  expect(socketHandler.stream).toBeInstanceOf(Observable);
  expect(socketHandler._channels).toEqual({});
});

test('socketHandler will connect on initialisation', async () => {
  expect(socketHandler.connected).toBe(false);
  await socketHandler.init();
  expect(socketHandler.connected).toBe(true);
});

describe('socket handling events', () => {

  let eventStream;
  beforeEach(() => {
    eventStream = [];
    socketHandler._stream = Observable.from(eventStream);
  });

  const fireEvent = ({ topic, event, payload = {} }) => {
    eventStream.push({
      topic,
      event,
      payload
    });
  };
});
