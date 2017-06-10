# eth.social

>

              in a completely decentralized way; it's built on top of the <a href="https://www.ethereum.org/" target="_blank">Ethereum</a> blockchain and hosted on <a href="https://ipfs.io/" target="_blank">IPFS</a>.

[https://eth.social](https://eth.social)

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

## Deployment

Compile smart contracts

```bash
truffle compile
```

Deploy smart contracts

```bash
truffle migrate --reset --network=testnet
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
