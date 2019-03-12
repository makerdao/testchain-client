import Observable from 'zen-observable';
import { Event } from './constants';

export default class ChannelHandler {
  constructor(name, socket, globalLogger) {
    this._name = name;
    this._channel = socket.channel(this._name);
    this._stream = this._buildChannelStream();
    this._log = globalLogger.extend(`${this._name}`);
    this._logger = this._stream.subscribe(value =>
      this._log(JSON.stringify(value, null, 4))
    );
    this.init();
  }

  get stream() {
    return this._stream;
  }

  get joined() {
    return this._channel.state === 'joined' ? true : false;
  }

  _buildChannelStream() {
    // gets all unique values in the Event constants
    // and removes anything matching 'status_changed_*'
    const eventsList = [...new Set(Object.values(Event))].filter(eventName => {
      if (/\b(?!status_changed_)\b\S+/.test(eventName)) {
        return eventName;
      }
    });

    return new Observable(stream => {
      eventsList.forEach(eventName => {
        this._channel.on(eventName, payload => {
          switch (eventName) {
            case Event.CHAIN_ERROR:
              stream.error({ eventName, payload });
              break;
            case Event.CHAIN_FAILURE:
              stream.error({ eventName, payload });
              break;
            case Event.CHAIN_STATUS_CHANGED:
              stream.next({
                eventName: `${Event.CHAIN_STATUS_CHANGED}_${payload.data}`,
                payload
              });
              break;
            default:
              stream.next({ eventName, payload });
          }
        });
      });
    });
  }

  on(eventName, cb) {
    const ref = this._channel.on(eventName, data => {
      const off = () => this._channel.off(eventName, ref);
      cb(data, off);
    });
  }

  once(_eventName) {
    return new Promise((resolve, reject) => {
      const observer = this._stream.subscribe(
        ({ eventName, payload }) => {
          if (eventName === _eventName) {
            observer.unsubscribe();
            resolve({ eventName, payload });
          }
        },
        ({ eventName, payload }) => {
          reject(JSON.stringify({ eventName, payload }, null, 4));
        }
      );
    });
  }

  init() {
    this._channel.join();
  }

  push(action, payload = {}) {
    this._channel.push(action, payload);
  }
}
