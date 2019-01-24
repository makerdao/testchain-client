import TestchainService from './TestchainService';
import SnapshotService from './SnapshotService';

export default class TestchainClient {
  constructor() {
    // this._testchainService = new TestchainService();
    // this._snapshotService = new SnapshotService();

    // const services = [this._testchainService, this._snapshotService];

    delegate(this, [new EventHandlerService(), new SnapshotService()]);
  }
}

// TODO: structure this so duplicate method names from different services can
// be added, see maker.js in SDK.
const methodsToDelegate = [
  'testHi',
  'tcServiceTest',
  'initialize',
  'connectApp',
  'isConnectedSocket',
  '_disconnectApp',
  '_leaveApi',
  'isConnectedApi',
  '_joinApi',
  '_listChains',
  'fetchChain'
];

function delegate(client, services) {
  for (const service of services) {
    // Object.assign(client.prototype, service.prototype);
    console.log('service in loop', service);
    console.log(
      'client proto/service proto',
      client.prototype,
      service.prototype
    );
    methodsToDelegate.forEach(method => {
      if (service[method])
        client[method] = (...args) => service[method](...args);
      //   if (service[method]) client[method] = service[method];
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

// import TestchainService from './TestchainService';
// import SnapshotService from './SnapshotService';
// import EventHandlerService from './EventHandlerService';

// class TestchainClient {
//   constructor() {}
// }

// // Add additional services to the superCtors array
// const client = inheritsMultiple(TestchainClient, [
//   TestchainService,
//   EventHandlerService,
//   SnapshotService
// ]);

// module.exports = client;

// function inheritsObject(baseObject, superObject) {
//   Object.setPrototypeOf(baseObject, superObject);
// }

// function inheritsMultipleConstructors(BaseCtor, SuperCtors) {
//   return new Proxy(BaseCtor, {
//     construct(_, [baseArgs = [], superArgs = []], newTarget) {
//       let instance = {};
//       instance = SuperCtors.reduce((acc, Ctor, i) => {
//         const args = superArgs[i] || [];
//         return Object.assign(acc, new Ctor(...args));
//       }, instance);
//       instance = Object.assign(instance, new BaseCtor(...baseArgs));
//       inheritsObject(instance, newTarget.prototype);
//       return instance;
//     }
//   });
// }

// function inheritsMultipleObjects(baseObject, superObjects) {
//   inheritsObject(
//     baseObject,
//     new Proxy(
//       Object.create(null), // dummy
//       {
//         get(target, key, rec) {
//           const parent = superObjects.find(_parent =>
//             Reflect.has(_parent, key)
//           );
//           if (parent !== undefined) {
//             return Reflect.get(parent, key);
//           }
//           return undefined;
//         },
//         has(target, key) {
//           const parentHasKey = superObjects.some(_parent =>
//             Reflect.has(_parent, key)
//           );
//           if (parentHasKey) {
//             return true;
//           }
//           return false;
//         }
//       }
//     )
//   );
// }

// function inheritsMultiple(BaseCtor, SuperCtors) {
//   inheritsMultipleObjects(
//     BaseCtor.prototype,
//     SuperCtors.map(Ctor => Ctor.prototype)
//   );
//   return inheritsMultipleConstructors(BaseCtor, SuperCtors);
// }
