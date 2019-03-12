import Observable from 'zen-observable';

const events = [
  'phx_reply',
  'phx_error',
  'status_changed',
  'stopped',
  'error',
  'failed',
  'starting',
  'started',
  'deploying',
  'deployed',
  'deployment_failed',
  'ready',
  'terminated',
  'snapshot_taken',
  'snapshot_reverted'
];

export default class ChannelHandler {
  constructor(name, socket, globalLogger) {
    this._name = name;
    this._channel = socket.channel(this._name);
    this._stream = this._buildChannelStream(events);
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

  _buildChannelStream(eventsList) {
    return new Observable(stream => {
      const setChannelEvent = eventName => {
        this._channel.on(eventName, payload => {
          switch (eventName) {
            case 'deployment_failed':
              stream.error({ eventName, payload });
              break;
            case 'error':
              stream.error({ eventName, payload });
              break;
            case 'failed':
              stream.error({ eventName, payload });
              break;
            case 'status_changed':
              stream.next({
                eventName: `status_changed_${payload.data}`,
                payload
              });
              break;
            default:
              stream.next({ eventName, payload });
          }
        });
      };

      eventsList.forEach(eventName => {
        setChannelEvent(eventName);
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
