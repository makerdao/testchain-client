export default class EventService {
  constructor(channel) {
    this._channel = channel;
    this._refs = {};
  }

  _registerEvent(label, event, cb) {
    const ref = this._channel.on(event, cb);
    this._refs[label + ':' + event] = ref;
  }

  _unregisterEvent(label, event) {
    let ref = this._refs[label + ':' + event];
    delete this._refs[label + ':' + event];
    this._channel.off(event, ref);
  }

  _cleanEventName(event) {
    switch (event) {
      case 'start':
        return 'started';
      default:
        return event;
    }
  }

  once(event, cb) {
    event = this._cleanEventName(event);
    const randomEventId = Math.random()
      .toString(36)
      .substr(2, 5);

    this._registerEvent(`once:${randomEventId}`, event, data => {
      this._unregisterEvent(`once:${randomEventId}`, event);
      cb(data);
    });
  }
}
