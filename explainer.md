# How To Use The Testchain-Client

### Setup

``` javascript
import Client from 'Testchain-Client';

const client = new Client(
    'http://127.0.0.1',			// <API_URL>
    '4000',				// <API_PORT>
    'ws://127.0.0.1:4000'		// <WEBSOCKET_ENDPOINT>
);

client.init().then(() => {
    console.log('Client initialised');
});
```

The `Client` is divided into two modes of communication with the [testchain-backendgateway](https://github.com/makerdao/testchain-backendgateway), a REST api for retrieving chain and snapshot data, and a websocket api for performing chain functions.

### `stream()` and `once()`

These are the two main functions of the client and are used largely in conjunction with the other websocket functions. Using [RxJS](https://rxjs-dev.firebaseapp.com/), each channel, (effectively each chain), listens for a set of events (which can be found at the bottom of the document). The object that allows this is called an [`Observable`](https://rxjs-dev.firebaseapp.com/api/index/class/Observable) which is a set of these events over a period of time.

##### `stream()`

The Client's `stream()` function returns the `Observable` which we can then subscribe to and monitor the data stream coming from each chain.

``` javascript
const chainStream = client.stream(id); // Specify the chain by it's id
const obs = chainStream.subscribe(
    ({ event, payload }) => {
        // do something
    },
    (err) => throw ...,	
);
.
.
.
obs.unsubscribe();
```
In the above example, the RxJS Observable is assigned to our `chainStream` constant. We use `subscribe` to pass two callbacks which are executed dependent on incoming events.

The first, is where all incoming data is passed and where a user should expect to find the chain events and returning data. The client has bootstrapped the `event` name to each returned object to make it easier for the user to specify a target event. The second callback is the error event which is used in the event that a chain fires an error event (TODO).
We can easily unsubscribe from these events later.

##### `once()`

The `once()` function builds around this subscription model and wraps a promise based on the next incoming event, returning the payload. This is especially useful around events like `started` and `snapshot_taken` which return data based on their events.

```javascript
client.create({ ...args });
const chain = await client.once('api', 'started');
```
The above awaits on a promise which resolves on the `started` event firing on the `api` channel with that payload data.

---

### REST API

All http endpoints are handled through the `client.api()` function which returns an object of functions for returning system data.

##### List all chains
``` javascript
client.api().listAllChains();
```

Returns a `promise` which resolves to a list of all chains that have been created by the system `/chains, GET`

##### List all snapshots

``` javascript
client.api().listAllSnapshots('geth'); // defaults to 'ganache' 
```
Returns a `promise` which resolves to a list of all snapshots that have been created on either a ganache or geth chain. `/snapshots/${ganache|geth}, GET`

##### Get chain information

``` javascript
client.api().getChain(id) // where id is a chain id
```
Returns a `promise` which resolves to an object of data with the chain details. `/chain/${id}, GET`

##### Delete a chain

``` javascript
client.api().deleteChain(id) 
```
Returns a `promise` which when resolved indicates the chain has been deleted. Will only work on stopped chains. `/chain/${id}, DELETE`

##### Download a snapshot

``` javascript
client.api().downloadSnapshot(id) // where id is a snapshot id 
```
Will attempt to download to file that snapshot. `/snapshot/${id}, GET`

---


### WEBSOCKET API


##### Create a chain

``` javascript
client.create(options);
```

##### Stop a chain

``` javascript
client.stop(id);
```

##### Restart a chain

``` javascript
client.restart(id);
```

##### Delete a chain

```javascript
client.delete(id);
```
Returns a `promise`, will stop chain and delete it.

##### Take a snapshot

```javascript
client.takeSnapshot(chainId, description);
```

##### Restore a snapshot
```javascript
client.restoreSnapshot(chainId, snapshotId);
```

--- 

### Events List
``` javascript
  'phx_reply',
  'status_changed',
  'error',
  'failed',
  'starting',
  'started',
  'deploying',
  'deployed',
  'deployment_failed',
  'ready',
  'terminated',
  'snapshot_taken',
  'snapshot_reverted'
```
