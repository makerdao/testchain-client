import _ from 'lodash';
import debug from 'debug';
const logEvent = debug('log:event');

export default class EventHandlerService {
  _registerDefaultEventListeners(id) {
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
          this._registerEvent(id, 'default', event, error =>
            logEvent(`ERROR: ${error}`)
          );
        }
        this._registerEvent(id, 'default', event, data => {
          logEvent(
            `\n chain : ${id}\n event : ${event}\n payload: ${JSON.stringify(
              data,
              null,
              2
            )}\n`
          );
        });
      }
      resolve();
    });
  }

  _registerEvent(id, label, event, cb) {
    let ref;

    if (id) {
      ref = this._chainList[id].channel.on(event, cb);
      _.set(this, `_chainList.${id}.eventRefs.${label}:${event}`, ref);
    } else {
      ref = this._apiChannel.on(event, cb);
      this._apiEventRefs[label + ':' + event] = ref;
    }
  }

  _unregisterEvent(id, label, event) {
    let ref;

    if (id) {
      _.set(this, `_chainList.${id}.eventRefs.${label}:${event}`, ref);
      delete this._chainList[id].eventRefs[label + ':' + event];
      this._chainList[id].channel.off(event, ref);
    } else {
      ref = this._apiEventRefs[label + ':' + event];
      delete this._apiEventRefs[label + ':' + event];
      this._apiChannel.off(event, ref);
    }
  }

  _apiOnce(event, cb) {
    this._once(false, event, cb);
  }

  _chainOnce(id, event, cb) {
    this._once(id, event, cb);
  }

  _once(id, event, cb) {
    // trigger a one-time callback from an event firing
    const randomEventId = Math.random()
      .toString(36)
      .substr(2, 5);
    this._registerEvent(id, `once:${randomEventId}`, event, async data => {
      this._unregisterEvent(id, `once:${randomEventId}`, event);
      cb(data);
    });
  }
}
