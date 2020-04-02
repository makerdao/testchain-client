<h1 align="center">
Testchain Client
</h1>

[![GitHub License][license]][license-url]
[![NPM][npm]][npm-url]

## Installation

#### Staxx

The client is to be used along with the [staxx](https://github.com/makerdao/staxx) which is a docker container containing all testchain functionality. Requires [docker](https://docs.docker.com/install/#server) and [docker-compose](https://docs.docker.com/compose/install/)

```bash
git clone https://github.com/makerdao/staxx.git
cd ./staxx
make docker-deps      # will download required docker images
make run-dev          # will take a minute or two
```

The data folder which docker will work out of is `/tmp` which will store chain and snapshot data under `/tmp/chains` and `/tmp/snapshots` respectively.

**NOTE** - The backendgateway takes approximately 5 minutes to download and organise all maker contracts from their various github repositories. By observing the undetached process of the `docker-compose up` command, it will be evident to the user when they are loaded.

#### Testchain-client

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

## Usage

To include the library:

```javascript
import { Client, Event } from '@makerdao/testchain-client';
```

The `client` can then be setup as follows:

```javascript
const client = new Client(
  'http://127.0.0.1:4000', // <REST_API_ENDPOINT>
  'ws://127.0.0.1:4000' // <WS_API_ENDPOINT>
);

client.init().then(() => {
  console.log('Client initialised');
});
```

The `client` takes two url parameters as shown above, the first being the REST
endpoint which is used for retrieving chain and snapshot data. The second being
a websocket endpoint for performing chain functions and listening to system
events. These events are declared as constants in the `Event` import.

The user must use the `init()` function on the client in order to setup the
endpoint connections correctly. It also automatically opens the `'api'` channel on the
websocket connection.

### REST API

The rest api is accessed by calling functions on `client.api` and is not to be
confused with the aformentioned `'api'` channel used by the websocket
connection. All functions are asynchronous.

- `listAllChains()` - returns a list of all the chains in existence.

- `listAllSnapshots(chainType)` - returns a list of all snapshots for each
  chaintype, `ganache` or `geth`

- `getChain(id)` - finds the chain with id and returns it's details
  including it's passed configuration data, it's account information and other
  chain information.

- `downloadSnapshotUrl(id)` - returns the download snapshot url endpoint.

- `getBlockNumber(id)` - will perform a json-rpc request to chain of `id` and
  return the current block number. This can be useful for debugging purposes.

- `mineBlock(id)` - if the chainType is `ganache`, a useful json-rpc command is
  included called `evm_mine` which is used to increment the blocknumber. This
  too is also useful for debugging purposes.

**_Example_**

```javascript
await client.api.getChain(id);
```

### WEBSOCKET API

This section lists the chain functions the client provides to interact with the websocket api. This is done over a websocket connection and we will examine in the next section how to intercept and monitor events coming from them.

As previously mentioned, when the `client` is initialised, it automatically
opens the `'api'` channel. We use this channel to create our chains instances by
passing an options object as a parameter.

**_Example_**

```javascript
{
    testchain: {
        config: {
            type: 'geth,
            accounts: 3,
            block_mine_time: 0,
            clean_on_stop: false, // Because we have to test restart
        },
        deps: []
    }
}
```

**To create the chain instance:**

```javascript
client.create(options);
```

In order to interact with the created chain instance we must first extract the
chain's `id`. When we create a chain instance, we are also creating a websocket
channel specific to that chain. Using that `id`, which we use as a parameter to
other functions, we can then find/create that channel.

To extract the `id` we make use of some of the event functionality that is
explained in the next section

```javascript
client.create({ ...options });
client.once('api', Event.CHAIN_CREATED).then(console.log);

// prints

{
    eventName: 'phx_reply',
    payload: {
        status: 'ok',
        response: {
            id: '7177259706074024037'
        }
    }
}

```

Once the `id` is extracted, the other functions are easily used.

**To stop a running chain:**

```javascript
client.stop(id);
```

**To restart a stopped chain:**

```javascript
client.restart(id);
```

**To take a snapshot of the current chains state:**

```javascript
client.takeSnapshot(id, description);
```

Taking a snapshot will stop the chain; if the chain was created with the config option `clean_on_stop: true`, the chain will be removed when stopped. Therefore, `takeSnapshot` can only be used with chains that have been created with `clean_on_stop: false`.

**To restore a snapshot of a previous chain state:**

```javascript
client.restoreSnapshot(id, snapshotId);
```

The `snapshotId` parameter refers to the id of the snapshot we wish to restore. If
the chain which initially created the snapshot no longer exists, this will create
a new chain instance using the snapshot.

**To remove a chain instance permanently:**

```javascript
client.delete(id);
```

This returns a promise and will stop a chain instance first before deleting it

### Events

As noted in the import of the `client`, we also imported the Event object.
This lists all events which can be listened to after performing websocket api functions.

The source file for all of these events is located under
`src/core/constants.js`. Many of these constants refer to the same string event
but by abstracting them to be more human-readable, gives better clarity.

The client uses the
[zen-observable](https://www.npmjs.com/package/zen-observable) library to
transform all websocket data into an `observable` object. An observable object
is an asynchronous data stream and can be subscribed to at any time. We
use this object and the event constants to observe the websocket channel's behaviour and
extract information as it comes down this stream.

**`stream()`\***

To subscribe to a chain's data stream, we call the `stream()` function which
returns the observable object for that channel.

```javascript
const chainStream = client.stream(id); // Specify the chain by it's id
const obs = chainStream.subscribe(
    ({ eventName, payload }) => {
        // do something
    }
);
.
.
.
obs.unsubscribe();
```

In the above example, the Observable is assigned to our `chainStream` constant.
`subscribe()` takes a callback function as an argument and is executed on an effective
infinite loop for each incoming event fired from the backend on each channel.
This callback is where all incoming data is passed and where a user should expect
to find the chain events and returning data. The client has bootstrapped the
value `eventName` to make it easier for the user to specify a target event.

**`once()`**

The `once()` function builds around this subscription model and wraps a promise
based on the next incoming event, returning the payload. This is especially
useful around functions like `create()` and `takeSnapshot()` which return data after being executed.

```javascript
client.create(options);
client.once('api', Event.CHAIN_STARTED).then(console.log);

// prints

{
    eventName: 'started',
    payload: {
        ws_url: 'ws://ex-testchain.local:8552',
        rpc_url: 'http://ex-testchain.local:8552',
        network_id: 999,
        id: '12449877630527910658',
        gas_limit: 9000000000000,
        coinbase: '0xf84174a9fb743c6df671bc391acab4a5bcafeefe',
        accounts: [ ... ]
    }
}

```

The above awaits on a promise which resolves on the `Event.CHAIN_STARTED` event
firing on the api channel with that payload data.

**`sequenceEvents()`**

Where we wish to observe and wait on multiple events to be fired, we can use
`sequenceEvents()`. This will return a promise which when resolved produces an
object of the fired events and the returned payloads.

```javascript
client.create(options);
this.sequenceEvents(id,
    [
        Event.CHAIN_STARTED,
        Event.CHAIN_STATUS_CHANGED,
        Event.CHAIN_READY
    ]).then(console.log);

// prints

{
    started: {
        ws_url: 'ws://ex-testchain.local:8571',
        rpc_url: 'http://ex-testchain.local:8571',
        network_id: 999,
        id: '11957893023697223559',
        gas_limit: 9000000000000,
        coinbase: '0x3a92149876fb55d685a15caea45979526a4b2242',
        accounts: [ ... ]
    },
    status_changed: {
        data: 'active'
    },
    ready: {}
}
```

**`on()`**

`on()` is similar to `once()` in that it will look to target an individual event
coming from a specific chain channel. The difference however is that `on()`
gives the user finer control in terms of what event and payload they wish to
listen for. `once()` will resolve its promise with the next event on the stream
that matches its event parameter.

The `on()` function takes three parameters, the chain id we wish to listen on,
the event we wish to listen for on that chain channel, and a callback which
fires on that event firing.

That callback contains the payload for that event and a function `off()` which
is used to unsubscribe from the `on()` when satisfied.

**_Example_**

A good example of this is in the `delete()` function where a promise is
returned. We use the `on()` function to resolve said promise when the correct
payload is returned signifying that it has been deleted.

```javascript
return new Promise(resolve => {
  this.on('api', Event.CHAIN_DELETED, (payload, off) => {
    const { response } = payload;
    if (response.message && response.message === 'Chain removed') {
      // do something now that chain has been deleted
      off();
      resolve();
    }
  });
});
```

## Development

In order to observe the stream visually, the client uses
[debug.js](https://github.com/visionmedia/debug) to extend logging functionality
to the console.

When testing, prepend the cli arg with an environement variable `DEBUG=log*`
which will print out all socket and channel events information.

- `log:api:*` will print all api events only
- `log:chain:*` will print all channel events only
- `log:*` will print all socket events only

### License

The testchain client is [MIT licensed](./LICENSE).

[license]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: https://github.com/makerdao/testchain-client/blob/master/LICENSE
[npm]: https://img.shields.io/npm/v/@makerdao/testchain-client.svg?style=flat
[npm-url]: https://www.npmjs.com/package/@makerdao/testchain-client
