import TestchainService from './TestchainService';
import SnapshotService from './SnapshotService';

export default class TestchainClient {
  constructor() {
    // this._testchainService = new TestchainService();
    // this._snapshotService = new SnapshotService();

    // const services = [this._testchainService, this._snapshotService];

    delegate(this, [new TestchainService(), new SnapshotService()]);
  }
}

const methodsToDelegate = ['testHi', 'tcServiceTest'];

function delegate(client, services) {
  for (const service of services) {
    console.log('service in loop', service);
    methodsToDelegate.forEach(method => {
      if (service[method]) client[method] = service[method];
    });
  }
}

// Object.assign(TestchainClient.prototype, thi);

// Object.assign(
//   TestchainClient.prototype,
//   passthroughMethods.reduce((acc, name) => {
//     acc[name] = function(...args) {
//       return this._testchainService[name](this._proxyAddress, ...args);
//     };
//     return acc;
//   }, {})
// );
