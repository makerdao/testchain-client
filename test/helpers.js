import Maker from '@makerdao/dai';
import configPlugin from '@makerdao/dai-plugin-config';
import governancePlugin from '@makerdao/dai-plugin-governance';

export async function setupTestMakerInstance(testchainId, url) {
  const makerConfig = {
    plugins: [
      //governancePlugin,
      [
        configPlugin,
        {
          testchainId: testchainId
        }
      ]
    ],
    log: false
  };

  const maker = await Maker.create('http', makerConfig);
  await maker.authenticate();
  return maker;
}
