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
        subscriber.next({ event: 'socket_open' });
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

  _once(eventName) {
    return new Promise(resolve => {
      const observer = this.stream.subscribe(({ event }) => {
        if (event === eventName) {
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
        const { event, payload } = data;
        switch (event) {
          case Event.CHAIN_ERROR:
            return { event, payload };
          case Event.CHAIN_FAILURE:
            return { event, payload };
          case Event.PHX_REPLY:
            return { event: Event.OK, payload };
          default:
            return { event, payload };
        }
      });
  }
}
