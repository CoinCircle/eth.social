module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    testnet: {
      host: "testnet.infura.io",
      port: 8545,
      network_id: "*" // Match any network id
    }
  }
};
