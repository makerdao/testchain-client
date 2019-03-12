export default class ChannelHandler {
  constructor(name, socket, globalLogger, stream) {
    this._name = name;
    this._channel = socket.channel(this._name);
    this._stream = stream;
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
