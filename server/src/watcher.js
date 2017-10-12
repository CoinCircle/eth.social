const Web3 = require('web3')
const pify = require('pify')

const {upsert} = require('./store')
const Meetup = require('../../build/contracts/Meetup.json')
const abi = Meetup.abi
const address = '0x790fe54b79400d23e9ea6f764a57330c083cf3c7'
const providerUri = 'wss://rinkeby.infura.io/ws'
const provider = new Web3.providers.WebsocketProvider(providerUri)
const web3 = new Web3(provider)
let instance = null

async function handleEvent (eventObj) {
  const {event:eventType, returnValues, transactionHash:txHash, blockNumber} = eventObj
  const id = returnValues[0]|0

  console.log(eventObj)

  if (eventType === '_MeetupCreated' || eventType === '_MeetupUpdated') {
  const {0:_id,1:organizer,1:ipfsHash} = await pify(instance.methods.getMeetup(id).call)()
    console.log(txHash,_id,organizer,ipfsHash, blockNumber)
    upsert({
      txHash,
      blockNumber,
      id: _id,
      ipfsHash,
      title: "foo",
      description: "bar"
    })
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
