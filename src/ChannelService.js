export default class ChannelService {
  constructor() {
    this._socketService = null;
    this._api = null;
  }

  start(socketService) {
    this._socketService = socketService;
  }

  join() {}
}
