export default class SnapshotService {
  constructor() {}
  takeSnapshot(id, label = 'snap:' + id) {
    return new Promise((resolve, reject) => {
      this._chainOnce(id, 'snapshot_taken', data => {
        const { id: snapId } = data;
        this._snapshots[snapId] = {
          ...data,
          chainId: id
        };
        this._chainOnce(id, 'started', data => {
          resolve(snapId);
        });
      });
      this._chainList[id].channel.push('take_snapshot', { description: label });
    });
  }

  revertSnapshot(snapshot) {
    const id = this.getSnap(snapshot).chainId;
    return new Promise((resolve, reject) => {
      this._chainOnce(id, 'snapshot_reverted', data => {
        const reverted_snapshot = data;
        this._chainOnce(id, 'started', data => {
          resolve(reverted_snapshot);
        });
      });
      this._chainList[id].channel.push('revert_snapshot', { snapshot });
    });
  }
  getSnapshots() {
    return this._snapshots;
  }

  getSnap(id) {
    return this._snapshots[id];
  }
}
