import TestChainService from './testchain';
// const TestchainService = require('./testchain.js');

const helloW = () => {
  console.log(TestChainService);
  return 'Hey Wordl2';
};

// exports.TestchainService = TestchainService;
export default TestChainService;

// export default {
//   addConfig: () => ({
//     additionalServices: ['testchain'],
//     testchain: TestChainService
//   })
// };
