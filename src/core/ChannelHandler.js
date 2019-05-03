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
    const observer = this.stream.subscribe(({ event, payload }) => {
      if (event === eventName) {
        const off = () => observer.unsubscribe();
        cb(payload, off);
      }
    });
  }

  once(eventName) {
    return new Promise((resolve, reject) => {
      const observer = this._stream.subscribe(
        ({ event, payload }) => {
          if (event === eventName) {
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

  push(action, payload = {}) {
    this._channel.push(action, payload);
  }
}
