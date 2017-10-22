function getDefaultAccount() {
  if (window.web3 && web3.eth.defaultAccount) {
    return web3.eth.defaultAccount
  } else if (window.web3 && web3.eth.accounts) {
    web3.eth.defaultAccount = web3.eth.accounts[0]
    return web3.eth.accounts[0]
  }

  return null
}

module.exports = {
  getDefaultAccount
}
