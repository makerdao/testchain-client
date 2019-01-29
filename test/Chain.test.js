import Chain from '../src/Chain.js';

let chain = new Chain();

test('initialize opens socket connection', async () => {
  await chain.initialize();
  expect(chain.service('socket').connected());
});
