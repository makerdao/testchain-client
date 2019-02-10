import { Observable } from 'rxjs';
import debug from 'debug';

const createLogger = label => debug(`log-${label}`);

const events = [
  'phx_reply',
  'status_changed',
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
      eventsList.forEach(event => {
        this._channel.on(event, data => {
          subscriber.next({ event: event, payload: data });
        });
      });
    });
  }

  once(eventName) {
    return new Promise(resolve => {
      const observer = this._stream.subscribe(({ event, payload }) => {
        if (event === eventName) {
          observer.unsubscribe();
          resolve(payload);
        }
      });
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

  // push(channel, event, payload = {}) {
  //   switch (event) {
  //     case 'list_chains':
  //       return this._pushReceive(channel, event, payload);
  //     case 'remove_chain':
  //       return this._pushReceive(channel, event, payload);
  //     default:
  //       return this._pushEvent(channel, event, payload);
  //   }
  // }

  // _pushEvent(name, event, payload = {}) {
  //   return new Promise(async (resolve, reject) => {
  //     this._event.once(name, event, data => {
  //       resolve(data);
  //     });
  //     await this.join(name);
  //     this.channel(name).push(event, payload);
  //   });
  // }

  // _pushReceive(name, event, payload = {}) {
  //   return new Promise(async resolve => {
  //     await this.join(name);
  //     this.channel(name)
  //       .push(event, payload)
  //       .receive('ok', resolve);
  //   });
  // }
}
