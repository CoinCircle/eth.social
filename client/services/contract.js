const InputDataDecoder = require('ethereum-input-data-decoder')

const contractConfig = require('../config/contract.json')
const contractAddress = contractConfig.address

const abiJson = require('../../build/contracts/Meetup.json')
const abiArray = abiJson.abi

const decoder = new InputDataDecoder(abiArray)

let contract = null;

class Contract {
  constructor() {

  }

  setContractInstance(instance) {
    this.instance = instance
  }

  createMeetup({title, description}) {
    return new Promise((resolve, reject) => {
      this.instance.createMeetup(
        title,
        description,
        startTimestamp,
        endTimestamp,
      (error, tx) => {
        if (error) return reject(error)
        resolve(tx)

        web3.eth.getTransaction(tx, (error, result) => {
          console.log(error, result)
          const decoded = decoder.decodeData(result.input);
          console.log(decoded)
        })
      })
    })
  }

  getMeetups(organizer) {
    return new Promise((resolve, reject) => {
      this.instance.getMeetupHashes.call(
      (error, meetupHashes) => {
        if (error) return reject(error)
        resolve(meetupHashes)
      })
    })
  }
}

function init() {
  const MeetupContract = web3.eth.contract(abiArray)

  contract = new Contract()
  contract.setContractInstance(MeetupContract.at(contractAddress))
}

function getInstance() {
  return contract
}

// wait for MetaMask to inject Web3
setTimeout(() => {
  init()
}, 500)

module.exports = {
  getInstance
}
