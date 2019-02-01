import { Socket } from 'phoenix';

export default class SocketService {
  constructor(url = 'ws://127.1:4000/socket') {
    this._url = url;
  }

  init() {}
}
