export default class SnapshotService {
  constructor(eventHandler) {
    this.eventHandler = eventHandler;
    this._snapshots = {};
  }

  takeSnapshot(id, label = 'snap:' + id) {
    return new Promise((resolve, reject) => {
      this.eventHandler._chainOnce(id, 'snapshot_taken', data => {
        const { id: snapId } = data;
        this._snapshots[snapId] = {
          ...data,
          chainId: id
        };
        // TODO: pretty much blocked by this. SS Service doesn't keep track of chain channels
        // which we need to pass to eventHandler service. Conversely, the EH service could
        // take an id, but then it would need a chain channel.
        // Putting aside for now.
        this.eventHandler._chainOnce(id, 'started', data => {
          resolve(snapId);
        });
      });
      this._chainList[id].channel.push('take_snapshot', { description: label });
    });
  }

  revertSnapshot(snapshot) {
    const id = this.getSnap(snapshot).chainId;
    return new Promise((resolve, reject) => {
      this.eventHandler._chainOnce(id, 'snapshot_reverted', data => {
        const reverted_snapshot = data;
        this.eventHandler._chainOnce(id, 'started', data => {
          resolve(reverted_snapshot);
        });
      });
      this._chainList[id].channel.push('revert_snapshot', { snapshot });
    });
  }
  getSnapshots() {
    return this._snapshots;
  }

  getSnapshot(id) {
    return this._snapshots[id];
  }

  listSnapshotsByChainId(chainId) {
    return new Promise((resolve, reject) => {
      this._apiChannel
        .push('list_snapshots', { chain: chainId })
        .receive('ok', data => {
          console.log('return this data', data);
          resolve(data);
        });
    });
  }
}
