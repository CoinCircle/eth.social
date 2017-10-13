const ipfsApi = require('ipfs-api')

const ipfs = ipfsApi({
  host: 'ipfsapi.eth.social',
  port: '443',
  protocol: 'https'
})

function uploadJson(obj) {
  return ipfs.add(Buffer.from(JSON.stringify(obj)))
}

function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      const buffer = Buffer.from(reader.result)
      ipfs.add(buffer)
      .then(files => {
        resolve(files)
      })
      .catch(error => reject(error))
    }

    reader.readAsArrayBuffer(file)
  })
}

function uploadFromUrl(url) {
  return new Promise((resolve, reject) => {
    ipfs.util.addFromURL(url)
    .then(files => {
      resolve(files)
    })
    .catch(error => reject(error))
  })
}

async function getJson (ipfsHash) {
  let json = {}

  if (!ipfsHash) {
    return json
  }

  try {
    json = await (await window.fetch(ipfsUrl(ipfsHash))).json()
  } catch (error) {

  }

  return json
}

function ipfsUrl(hash) {
  //return `https://gateway.ipfs.io/ipfs/${hash}`
  return `https://ipfsgateway.eth.social/ipfs/${hash}`
}

module.exports = {
  uploadJson,
  uploadFile,
  uploadFromUrl,
  getJson,
  ipfsUrl
}
