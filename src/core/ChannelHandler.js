import { Observable } from 'rxjs';
import debug from 'debug';

const createLogger = label => debug(`log:${label}`);

const events = [
  'phx_reply',
  'status_changed',
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
    this._socket = socket;
    this._channel = this._socket.channel(this._name);
    this._stream = this._buildChannelStream(events);
    this._log = createLogger(this._name);
    this._logger = this._stream.subscribe(value =>
      this._log(JSON.stringify(value, null, 4))
    );
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

  _once(eventName) {
    return new Promise(resolve => {
      const observer = this._stream.subscribe(({ event, payload }) => {
        if (event === eventName) {
          observer.unsubscribe();
          resolve(payload);
        }
      });
    });
  }

  async init() {
    this._channel.join();
    return await this._once('phx_reply');
  }

  // join(name) {
  //   return new Promise((resolve, reject) => {
  //     if (this._joined(name)) {
  //       resolve();
  //     }
  //     const ref = this.channel(name).on('phx_reply', ({ status }) => {
  //       if (status === 'ok') {
  //         this.channel(name).off('phx_reply', ref);
  //         resolve();
  //       }
  //     });
  //     this.channel(name).join();
  //   });
  // }

  // _joined(name) {
  //   if (this._channels[name] && this._channels[name].state === 'joined')
  //     return true;
  //   return false;
  // }

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
