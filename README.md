# eth.social

> An Ethereum dApp for posting social events.

<img src="./screenshots/ethsocial_home.png" width="800">

On Rinkeby testnet.

# Demo

**[https://eth.social](https://eth.social)**

# Architecture

<img src="./diagrams/ethsocial-containers-view.png" width="400">

NOTE: server and database not implemented yet. Currently this is a humble MVP.

# Development

Watch and compile client

```bash
cd client/

npm run watch
```

Run client server

```bash
cd client/

npm run browser
```

Start testrpc client

```bash
npm run testrpc
```

# Deployment

Compile smart contracts

```bash
truffle compile
```

Deploy smart contracts

```bash
truffle migrate --reset --network=development
```

Deploy client to IPFS

```bash
cd client/
npm run ipfs-deploy
```

# Test

Test smart contracts

```bash
truffle test
```

# License

MIT
