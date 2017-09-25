const HDWalletProvider = require('truffle-hdwallet-provider')
const fs = require('fs')

// first read in the secrets.json to get our mnemonic
let key = ''

if (fs.existsSync('./secrets.json')) {
  const secrets = require('./secrets.json')
  key = secrets.private
  //key = secrets.mnemonic
} else {
  console.log('no secrets.json found. You can only deploy to the testrpc.');
  key = ''
}

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    kovan: {
      provider: new HDWalletProvider(key, 'https://kovan.infura.io'),
      network_id: '*',
      gas: 4712383,
      gasPrice: 20000000000
    },
    rinkeby: {
      provider: new HDWalletProvider(key, 'https://rinkeby.infura.io'),
      network_id: '*',
      gas: 4712383,
      gasPrice: 20000000000
    },
    mainnet: {
      provider: new HDWalletProvider(key, 'https://mainnet.infura.io'),
      network_id: 1,
      gas: 4500000,
      gasPrice: 10000000000
    }
  }
};
