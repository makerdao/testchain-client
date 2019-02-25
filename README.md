<h1 align="center">
Testchain Client
</h1>

[![GitHub License][license]][license-url]
[![NPM][npm]][npm-url]

### Installation

##### Testchain-backendgateway

The client is to be used in tandem with the [testchain-backendgateway](https://github.com/makerdao/testchain-backendgateway) which is a docker container containing the all testchain functionality. Requires [docker](https://docs.docker.com/install/#server) and [docker-compose](https://docs.docker.com/compose/install/)

```bash
git clone https://github.com/makerdao/testchain-backendgateway.git
cd ./testchain-backendgateway
make build          # will take a minute or two

docker-compose up   # -d, will detach process
```

The data folder which docker will work out of is `/tmp` which will store chain and snapshot data under `/tmp/chains` and `/tmp/snapshots` respectively.

##### Testchain-client

The client can be installed locally as follows:

```bash
git clone https://github.com/makerdao/testchain-client.git
cd ./testchain-client
yarn install
```

To build the project, simply run `yarn build`, or to build on file changes, `yarn build:watch`.

### Usage

To use the library, simply run in your project folder:

```bash
yarn add @makerdao/testchain-client
```

then import the client as follows into your project

```javascript
import Client from '@makerdao/testchain-client';
```

### License

The testchain client is [MIT licensed](./LICENSE).

[license]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: https://github.com/makerdao/testchain-client/blob/master/LICENSE
[npm]: https://img.shields.io/npm/v/@makerdao/testchain-client.svg?style=flat
[npm-url]: https://www.npmjs.com/package/@makerdao/testchain-client
