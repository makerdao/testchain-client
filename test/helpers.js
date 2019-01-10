import Maker from '@makerdao/dai';
import configPlugin from '@makerdao/dai-plugin-config';
import governancePlugin from '@makerdao/dai-plugin-governance';
import TestChainService from '../src';

export async function setupTestMakerInstance(testchainId) {
  const makerConfig = {
    plugins: [
      //governancePlugin,
      [configPlugin, { testchainId: testchainId }],
      TestChainService
    ],
    log: false
  };

  const maker = await Maker.create('http', makerConfig);
  await maker.authenticate();
  return maker;
}
