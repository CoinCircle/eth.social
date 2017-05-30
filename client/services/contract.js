const InputDataDecoder = require('ethereum-input-data-decoder')

const contractConfig = require('../config/contract.json')
const contractAddress = contractConfig.address

const abiJson = require('../../build/contracts/Meetup.json')
const abiArray = abiJson.abi

const decoder = new InputDataDecoder(abiArray)

let contract = null;

function meetupArrayToObject(meetup) {
  let [
    title,
    description,
    startTimestamp,
    endTimestamp,
    createdTimestamp,
    organizer
  ] = meetup

  startTimestamp = startTimestamp.toNumber()
  endTimestamp = endTimestamp.toNumber()
  createdTimestamp = createdTimestamp.toNumber()

  return {
    title,
    description,
    startTimestamp,
    endTimestamp,
    createdTimestamp,
    organizer
  }
}

class Contract {
  constructor() {

  }

  setContractInstance(instance) {
    this.instance = instance
  }

  createMeetup({title, description, startTimestamp, endTimestamp}) {
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

  getAllMeetups(organizer) {
    return new Promise((resolve, reject) => {
      this.instance.getAllMeetupHashes.call(
      (error, meetupHashes) => {
        if (error) return reject(error)

        const promises = meetupHashes.map(hash => {
          return new Promise((resolve, reject) => {
            this.instance.getMeetupByHash.call(hash, (error, result) => {
              if (error) reject(error)

              resolve(meetupArrayToObject(result))
            })
          })
        })

        Promise.all(promises)
        .then(results => {
          resolve(results)
        })
      })
    })
  }
}

function init() {
  if (!web3.eth.defaultAccount) {
    web3.eth.defaultAccount = web3.eth.accounts[0]
  }

  if (!web3.eth.defaultAccount) {
    console.error('No default account set')
  }

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
}, 1000)

module.exports = {
  getInstance
}
