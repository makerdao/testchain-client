import TestchainService from './TestchainService';
import SnapshotService from './SnapshotService';

class TestchainClient {
  constructor() {
    this._baseThing = 'somebaseprop';
    // const services = [new TestchainService(), new SnapshotService()];
    // delegate(this, services);
  }
}

// const methodsToDelegate = ['testHi', 'tcServiceTest'];

// function delegate(client, services) {
//   for (const service of services) {
//     console.log(typeof service);
//     methodsToDelegate.forEach(method => {
//       if (service[method]) client[method] = service[method];
//     });
//   }
// }
// const client = classMixin(TestchainClient, TestchainService);
const client = mixin(TestchainService, TestchainClient.prototype);

function mixin(source, target) {
  for (var prop in source) {
    if (source.hasOwnProperty(prop)) {
      target[prop] = source[prop];
    }
  }
  return target;
}

function classMixin(testchainClient, _service) {
  console.log(_service);
  //   for (let _service of otherClasses) {
  for (var key of Object.getOwnPropertyNames(_service.prototype)) {
    console.log(key);
    testchainClient.prototype[key] = _service.prototype[key];
  }
  //   }
  return testchainClient;
}

module.exports = client;

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
