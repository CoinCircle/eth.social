const Web3 = require('web3')
const pify = require('pify')
const request = require('request-promise')

const {upsert} = require('./store')
const Meetup = require('../../build/contracts/Meetup.json')
const abi = Meetup.abi
const address = '0x790fe54b79400d23e9ea6f764a57330c083cf3c7'
const providerUri = 'wss://rinkeby.infura.io/ws'
const provider = new Web3.providers.WebsocketProvider(providerUri)
const web3 = new Web3(provider)
let instance = null

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

async function handleEvent (eventObj) {
  const {event:eventType, returnValues, transactionHash:txHash, blockNumber} = eventObj
  const id = returnValues[0]|0

  console.log(eventObj)

  if (eventType === '_MeetupCreated' || eventType === '_MeetupUpdated') {
  const data = await pify(instance.methods.getMeetup(id).call)()
  let organizer = data[1]
  let ipfsHash = data[2]

    let {
        title,
        description,
        location,
        tags,
        image,
        start,
        end,
        created,
        updated,
        deleted,
    } = await getJson(ipfsHash)

    if (title && start) {
      upsert({
        txHash,
        blockNumber,
        id,
        ipfsHash,
        title,
        description,
        location,
        tags: tags.join(','),
        image,
        start,
        end,
        created,
        updated,
        organizer,
        deleted: deleted|0
      })
    }
  }
}

function handlePastEvent (eventObj) {
  return handleEvent(eventObj)
}

async function start () {
  instance = new web3.eth.Contract(abi, address)

  instance.getPastEvents('allEvents',
    {fromBlock:0, toBlock: 'latest'},
    (error, logs) => {
      logs.forEach(handlePastEvent)
  })

  instance.events.allEvents((error, log) => {
    if (error) {
      console.error(error)
    }

    handleEvent(log)
  })

  console.log('listening for events')
}

module.exports = { start }
