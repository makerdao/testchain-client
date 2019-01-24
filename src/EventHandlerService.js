import _ from 'lodash';
import debug from 'debug';
const logEvent = debug('log:event');

export default class EventHandlerService {
  constructor(apiChannel) {
    this._apiEventRefs = {};
    this._apiChannel = apiChannel;
  }
  _registerDefaultEventListeners(chain) {
    return new Promise(resolve => {
      const eventNames = {
        started: 'started',
        error: 'error',
        stopped: 'stopped',
        status_changed: 'status_changed',
        snapshot_taken: 'snapshot_taken',
        snapshot_reverted: 'snapshot_reverted'
      };

      for (let event of Object.values(eventNames)) {
        if (event === eventNames.error) {
          this._registerEvent(chain, 'default', event, error =>
            logEvent(`ERROR: ${error}`)
          );
        }
        this._registerEvent(chain, 'default', event, data => {
          logEvent(
            `\n chain : ${
              chain.id
            }\n event : ${event}\n payload: ${JSON.stringify(data, null, 2)}\n`
          );
        });
      }
      resolve();
    });
  }

  _registerEvent(chain, label, event, cb) {
    let ref;

    if (chain) {
      ref = chain.channel.on(event, cb);
      _.set(this, `_chainList.${chain.id}.eventRefs.${label}:${event}`, ref);
    } else {
      ref = this._apiChannel.on(event, cb);
      this._apiEventRefs[label + ':' + event] = ref;
    }
  }

  _unregisterEvent(chain, label, event) {
    let ref;

    if (chain) {
      _.set(this, `_chainList.${chain.id}.eventRefs.${label}:${event}`, ref);
      delete chain.eventRefs[label + ':' + event];
      chain.channel.off(event, ref);
    } else {
      ref = this._apiEventRefs[label + ':' + event];
      delete this._apiEventRefs[label + ':' + event];
      this._apiChannel.off(event, ref);
    }
  }

  _apiOnce(event, cb) {
    this._once(false, event, cb);
  }

  _chainOnce(chain, event, cb) {
    this._once(chain, event, cb);
  }

  _once(chain, event, cb) {
    // trigger a one-time callback from an event firing
    const randomEventId = Math.random()
      .toString(36)
      .substr(2, 5);
    this._registerEvent(chain, `once:${randomEventId}`, event, async data => {
      this._unregisterEvent(chain, `once:${randomEventId}`, event);
      cb(data);
    });
  }
}
