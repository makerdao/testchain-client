export default class EventService {
  constructor(socket) {
    this._socket = socket;
    this._refs = {};
  }

  _registerEvent(name, label, event, cb) {
    const ref = this._socket.channel(name).on(event, cb);
    this._refs[label + ':' + event] = ref;
  }

  _unregisterEvent(name, label, event) {
    const ref = this._refs[label + ':' + event];
    delete this._refs[label + ':' + event];
    this._socket.channel(name).off(event, ref);
  }

  _cleanEventName(event) {
    switch (event) {
      case 'start':
        return 'started';
      case 'stop':
        return 'stopped';
      case 'start_existing':
        return 'started';
      case 'take_snapshot':
        return 'snapshot_taken';
      case 'revert_snapshot':
        return 'snapshot_reverted';
      default:
        return event;
    }
  }

  once(channel, event, cb) {
    event = this._cleanEventName(event);
    const randomEventId = this._randomId();

    if (event === 'snapshot_taken' || event === 'snapshot_reverted') {
      this._registerEvent(
        channel,
        `once:${randomEventId}`,
        event,
        snapshotData => {
          const startedId = this._randomId();
          this._registerEvent(
            channel,
            `once:${startedId}`,
            'started',
            chainData => {
              this._unregisterEvent(channel, `once:${randomEventId}`, event);
              this._unregisterEvent(channel, `once:${startedId}`, event);

              cb({ chain: chainData, snapshot: snapshotData });
            }
          );
        }
      );
    } else {
      this._registerEvent(channel, `once:${randomEventId}`, event, data => {
        this._unregisterEvent(channel, `once:${randomEventId}`, event);
        cb(data);
      });
    }
  }

  _randomId() {
    return Math.random()
      .toString(36)
      .substr(2, 5);
  }
}
