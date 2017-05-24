module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    adchain: {
      host: "testrpc.adchain.com",
      port: 80,
      network_id: "*" // Match any network id
    }
  }
};
