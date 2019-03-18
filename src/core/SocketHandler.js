import { Socket } from 'phoenix';
import Observable from 'zen-observable';
import ChannelHandler from './ChannelHandler';
import debug from 'debug';
import { ChannelName, Event } from './constants';
const { API } = ChannelName;

export default class SocketHandler {
  constructor(url = 'ws://127.1:4000/socket') {
    this._socket = new Socket(url, {
      transport: WebSocket
    });

    this._stream = new Observable(subscriber => {
      this._socket.onOpen(() => {
        subscriber.next({ eventName: 'socket_open' });
      });

      this._socket.onMessage(msg => {
        subscriber.next(msg);
      });
    });

    this._globalLogger = debug('log');
    this._socketLog = this._globalLogger.extend('socket');

    this._logger = this.stream.subscribe(value =>
      this._socketLog(JSON.stringify(value, null, 4))
    );

    this._channels = {};
  }

  get channels() {
    return Object.keys(this._channels);
  }

  get connected() {
    return this._socket.isConnected();
  }

  get stream() {
    return this._stream;
  }
 
  _once(_eventName) {
    return new Promise(resolve => {
      const observer = this.stream.subscribe(({ eventName }) => {
        if (_eventName === eventName) {
          observer.unsubscribe();
          resolve();
        }
      });
    });
  }

  async init() {
    this._socket.connect();
    await this._once('socket_open');
  }

  channel(name) {
    const channelName = name === API ? API : `chain:${name}`;
    if (!this._channels[channelName]) {
      this._channels[channelName] = new ChannelHandler(
        channelName,
        this._socket,
        this._globalLogger,
        this._buildChannelStream(channelName)
      );
    }
    return this._channels[channelName];
  }

  removeChannel(id) {
    delete this._channels[id];
  }

  _buildChannelStream(channelName) {
    return this.stream
      .filter(data => data.topic === channelName)
      .map(data => {
        const { event: eventName, payload } = data;
        switch (eventName) {
          case Event.CHAIN_ERROR:
            return { eventName, payload };
          case Event.CHAIN_FAILURE:
            return { eventName, payload };
          case Event.CHAIN_STATUS_CHANGED:
            return {
              eventName: `${Event.CHAIN_STATUS_CHANGED}_${payload.data}`,
              payload
            };
          default:
            return { eventName, payload };
        }
      });
  }
}
