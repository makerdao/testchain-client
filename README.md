<h1 align="center">
Testchain Client
</h1>

[![GitHub License][license]][license-url]
[![NPM][npm]][npm-url]

### Setup

In order to use the testchain-client, we must have a running instance of the
[testchain-backendgateway](https://github.com/makerdao/testchain-backendgateway).

#### Testchain-backendgateway Installation & Setup

**NOTE:** Requires [docker](https://docs.docker.com/install/)

```
git clone https://github.com/makerdao/testchain-backendgateway.git
```

Once installed, we build the projects dependencies by running the command below
inside the testchain-backendgateway directory.

```
make build
```

This may take a few minutes. Once installed we can then start our local instance
of the backend by running:

```
docker-compose up
```

Passing `-h` will detach the process. I would advise against it as the logging
output from the backend helps with debugging. If we wish to shutdown the backend
we can run `docker-compose down`.

Once the docker container has been started, it will begin a 10-15 minute process
of loading the various deployment steps. If you attempt to request
http://localhost:4000/deployment/steps, it will respond with no information
until they have been loaded.

During this time, chains may still be created but will refuse to deploy a
deployment step if a `step_id` parameter has been passed. Once the contracts are
loaded, an attempt to create a chain with a `step_id` will also take several
minutes.

### Development

This plugin creates a testchain by passing a config object to a websocket API running ex_testchain
https://github.com/makerdao/ex_testchain

## Code Style

We run Prettier on-commit, which means you can write code in whatever style you want and it will be automatically formatted according to the common style when you run `git commit`.

### License

The testchain client is [MIT licensed](./LICENSE).

[license]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: https://github.com/makerdao/testchain-client/blob/master/LICENSE
[npm]: https://img.shields.io/npm/v/@makerdao/testchain-client.svg?style=flat
[npm-url]: https://www.npmjs.com/package/@makerdao/testchain-client
