import TestchainService from './TestchainService';
import SnapshotService from './SnapshotService';
import EventHandlerService from './EventHandlerService';

class TestchainClient {
  constructor() {}
}

// Add additional services to the superCtors array
const client = inheritsMultiple(TestchainClient, [
  TestchainService,
  EventHandlerService,
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
