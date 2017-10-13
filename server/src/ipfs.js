const request = require('request-promise')

function ipfsUrl(hash) {
  //return `https://gateway.ipfs.io/ipfs/${hash}`
  return `https://ipfsgateway.eth.social/ipfs/${hash}`
}

async function getJson (ipfsHash) {
  let json = {}

  try {
    json = await request({
      url: ipfsUrl(ipfsHash),
      json: true
    })
  } catch (error) {
    console.error(error)
  }

  return json
}

module.exports = {
  ipfsUrl,
  getJson
}
