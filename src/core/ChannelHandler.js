import { Observable } from 'rxjs';
import debug from 'debug';

const createLogger = label => debug(`log-${label}`);

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
  constructor(name, socket) {
    this._name = name;
    this._channel = socket.channel(this._name);
    this._stream = this._buildChannelStream(events);
    this._log = createLogger(this._name);
    this._logger = this._stream.subscribe(value =>
      this._log(JSON.stringify(value, null, 4))
    );
    this.init();
  }

  _buildChannelStream(eventsList) {
    return new Observable(subscriber => {
      const setChannelEvent = event => {
        this._channel.on(event, payload => {
          switch (event) {
            case 'deployment_failed':
              subscriber.error({ event, payload });
              break;
            case 'error':
              subscriber.error({ event, payload });
              break;
            case 'failed':
              subscriber.error({ event, payload });
              break;
            case 'status_changed':
              subscriber.next({
                event: `status_changed_${payload.data}`,
                payload
              });
              break;
            default:
              subscriber.next({ event, payload });
          }
        });
      };

      eventsList.forEach(event => {
        setChannelEvent(event);
      });
    });
  }

  on(event, cb) {
    const ref = this._channel.on(event, data => {
      const off = () => this._channel.off(event, ref);
      cb(data, off);
    });
  }

  once(_event) {
    return new Promise((resolve, reject) => {
      const observer = this._stream.subscribe(
        ({ event, payload }) => {
          if (event === _event) {
            observer.unsubscribe();
            resolve({ event, payload });
          }
        },
        ({ event, payload }) => {
          reject(JSON.stringify({ event, payload }, null, 4));
        }
      );
    });
  }

  init() {
    this._channel.join();
  }

  push(event, payload = {}) {
    this._channel.push(event, payload);
  }

  stream() {
    return this._stream;
  }

  joined() {
    return this._channel.state === 'joined' ? true : false;
  }
}
