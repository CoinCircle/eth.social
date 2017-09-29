function getDefaultAccount() {
  if (web3 && web3.eth.defaultAccount) {
    return web3.eth.defaultAccount
  } else if (web3 && web.eth.accounts) {
    return web3.eth.accounts[0]
  }

  return null
}

module.exports = {
  getDefaultAccount
}
