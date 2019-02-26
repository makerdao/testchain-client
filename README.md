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

If you want to install the library directly from npm:

```bash
yarn add @makerdao/testchain-client
```

### Usage

To include the library:

```javascript
import { Client, Event } from '@makerdao/testchain-client';
```

The `client` can then be setup as follows:

``` javascript
const client = new Client(
    'http://127.0.0.1:4000',	// <REST_API_ENDPOINT>
    'ws://127.0.0.1:4000'		// <WS_API_ENDPOINT>
);

client.init().then(() => {
    console.log('Client initialised');
});
```

The `client` takes two url params as shown above, the first being the REST
endpoint which is used for retrieving chain and snapshot data. The second being
a websocket endpoint for performing chain functions and listening to system
events. These events are declared as constants in the `Event` import

The user must use the `init()` function on the client in order to setup the
endpoint connections correctly. It also automatically opens the `'api'` channel on the
websocket connection.

##### REST API

The rest api is accessed by calling functions on `client.api()` and is not to be
confused with the aformentioned `'api'` channel used by the websocket
connection. All functions are asynchronous.

- `listAllChains()` - returns a list of all the chains in existence.

- `listAllSnapshots(chainType)` - returns a list of all snapshots for each
  chaintype, `ganache` or `geth`
  
- `getChain(id)` - finds the chain with id equal to id and returns it's details
  including it's passed configuration data, it's account information and other
  miscellaneous data.

- `downloadSnapshot(id)` - downloads the snapshot data to file.

- `getBlockNumber(url)` - will perform a json-rpc request to the chain with
  `url` and return the current block number. This can be useful for debugging
  purposes.
  
- `mineBlock(url)` - if the chainType is `ganache`, a useful json-rpc command is
  included called `evm_mine** which is used to increment the blocknumber. This
  too is also usefule for debugging purposes.
  
***Example***

``` javascript
await client.api().getChain(id)
```


##### WEBSOCKET API

This section is in reference to the functions which are used to perform chain
functions. This is done over a websocket connections and we will examine in the
next section how to intercept and monitor events coming from these
connections.

As previously mentioned, when the `client` is initialised, it automatically
opens the `'api'** channel. We use this channel to create our chains instances by
passing an options object as a parameter.

***Example***
``` javascript
const options = {
    clean_on_stop: false,
    chainType: 'ganace',
    block_mine_time: 0,
    accounts: 3
}
```

We then can simply create the chain instance:

``` javascript
client.create(options)
```

In order to interact with the created chain instance we must first extract the
chain's `id`. When we create a chain instance, we are also creating a websocket
channel specific to that chain. Using that `id`, which we use as a parameter to
other functions, we can find/create that channel.

To extract the `id` we make use of some of the event functionality that is
explained in the next section

``` javascript
client.create({ ...options });
client.once('api', Event.OK).then(console.log); 

// prints

{ 
    event: 'phx_reply',
    payload: { 
        status: 'ok',
        response: { 
            id: '7177259706074024037' 
        } 
    } 
}

```

Once the `id` is extracted, the other functions are easily used.

To stop a running chain: 

``` javascript
client.stop(id)
```

To restart a stopped chain:

``` javascript
client.restart(id)
```

To take a snapshot of the current chains state:

``` javascript
client.takeSnapshot(id, description)
```

To restore a snapshot of a previous chain state:

``` javascript
client.restoreSnapshot(id, snapshot)
```

The `snapshot` parameter refers to the id of the snapshot we wish to restore. If
the chain which initally created the snapshot no longer exists, this will create
a new chain instance using the snapshot. (TODO)

To remove a chain instance permanently:

``` javascript
client.delete(id)
```
This returns a promise and will stop a chain instance first before deleting it


### License

The testchain client is [MIT licensed](./LICENSE).

[license]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: https://github.com/makerdao/testchain-client/blob/master/LICENSE
[npm]: https://img.shields.io/npm/v/@makerdao/testchain-client.svg?style=flat
[npm-url]: https://www.npmjs.com/package/@makerdao/testchain-client
