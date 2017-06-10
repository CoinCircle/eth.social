function getDefaultAccount() {
  if (web3 && web3.eth.defaultAccount) {
    return web3.eth.defaultAccount;
  }

  return null;
}

module.exports = {
  getDefaultAccount
}
