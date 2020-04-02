import Client from '../src/Client';
import Maker from '@makerdao/dai';
import configPlugin from '@makerdao/dai-plugin-config';

export async function setupTestMakerInstance(testchainId, url) {
  const makerConfig = {
    plugins: [
      //governancePlugin,
      [
        configPlugin,
        {
          testchainId: testchainId,
          url: url
        }
      ]
    ],
    log: false
  };

  const maker = await Maker.create('http', makerConfig);
  await maker.authenticate();
  return maker;
}

export function setupClient() {
  const testchainUrl = process.env.TESTCHAIN_URL ? `http://${process.env.TESTCHAIN_URL}` : 'http://127.0.0.1:4000';
  const websocketUrl = process.env.TESTCHAIN_URL ? `ws://${process.env.TESTCHAIN_URL}/socket` : 'ws://127.0.0.1:4000/socket';

  return new Client(testchainUrl, websocketUrl);
}

export async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createDescription (name, chainType) {
  const timestamp = new Date();
  return `Jest ${name} ${chainType} ${timestamp.toUTCString()}`;
}

export function randomString(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}