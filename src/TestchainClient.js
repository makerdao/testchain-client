import TestchainService from './TestchainService';
import SnapshotService from './SnapshotService';

class TestchainClient {
  constructor() {
    this._baseThing = 'somebaseprop';
    // const services = [new TestchainService(), new SnapshotService()];
    // delegate(this, services);
  }
}

const client = inheritsMultiple(TestchainClient, [
  TestchainService,
  SnapshotService
]);

module.exports = client;

function inheritsObject(baseObject, superObject) {
  Object.setPrototypeOf(baseObject, superObject);
}

function inheritsMultipleConstructors(BaseCtor, SuperCtors) {
  return new Proxy(BaseCtor, {
    construct(_, [baseArgs = [], superArgs = []], newTarget) {
      let instance = {};
      instance = SuperCtors.reduce((acc, Ctor, i) => {
        const args = superArgs[i] || [];
        return Object.assign(acc, new Ctor(...args));
      }, instance);
      instance = Object.assign(instance, new BaseCtor(...baseArgs));
      inheritsObject(instance, newTarget.prototype);
      return instance;
    }
  });
}

function inheritsMultipleObjects(baseObject, superObjects) {
  inheritsObject(
    baseObject,
    new Proxy(
      Object.create(null), // dummy
      {
        get(target, key, rec) {
          const parent = superObjects.find(_parent =>
            Reflect.has(_parent, key)
          );
          if (parent !== undefined) {
            return Reflect.get(parent, key);
          }
          return undefined;
        },
        has(target, key) {
          const parentHasKey = superObjects.some(_parent =>
            Reflect.has(_parent, key)
          );
          if (parentHasKey) {
            return true;
          }
          return false;
        }
      }
    )
  );
}

function inheritsMultiple(BaseCtor, SuperCtors) {
  inheritsMultipleObjects(
    BaseCtor.prototype,
    SuperCtors.map(Ctor => Ctor.prototype)
  );
  return inheritsMultipleConstructors(BaseCtor, SuperCtors);
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
// const client = mixin(TestchainService, TestchainClient.prototype);

// function mixin(source, target) {
//   for (var prop in source) {
//     if (source.hasOwnProperty(prop)) {
//       target[prop] = source[prop];
//     }
//   }
//   return target;
// }

// function classMixin(testchainClient, _service) {
//   console.log(_service);
//   //   for (let _service of otherClasses) {
//   for (var key of Object.getOwnPropertyNames(_service.prototype)) {
//     console.log(key);
//     testchainClient.prototype[key] = _service.prototype[key];
//   }
//   //   }
//   return testchainClient;
// }

// module.exports = client;

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
