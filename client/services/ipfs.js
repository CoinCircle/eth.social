const ipfsApi = require('ipfs-api')

//const ipfs = ipfsApi('127.0.0.1', '5001')
const ipfs = ipfsApi('ipfsd.eth.social', '5001')

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

  try {
    json = await (await window.fetch(ipfsUrl(ipfsHash))).json()
  } catch (error) {

  }

  return json
}

function ipfsUrl(hash) {
  return `https://gateway.ipfs.io/ipfs/${hash}`
  //return `http://ipfsd.eth.social/ipfs/${hash}`
  //return `http://localhost:9001/ipfs/${hash}`
}

module.exports = {
  uploadJson,
  uploadFile,
  uploadFromUrl,
  getJson,
  ipfsUrl
}
