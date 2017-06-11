const InputDataDecoder = require('ethereum-input-data-decoder')

const contractConfig = require('../config/contract.js')
const contractAddress = contractConfig.Meetup.address;

console.log(contractAddress)

const abiJson = require('../../build/contracts/Meetup.json')
const abiArray = abiJson.abi

const {DEFAULT_MEETUP_IMAGE} = require('../constants/defaults')
const ipfsUrl = require('../utils/ipfsUrl')

const decoder = new InputDataDecoder(abiArray)

let contract = null;

function meetupArrayToObject(meetup) {
  let [
    id,
    title,
    description,
    location,
    tags,
    image,
    startTimestamp,
    endTimestamp,
    createdTimestamp,
    organizer
  ] = meetup

  startTimestamp = startTimestamp.toNumber()
  endTimestamp = endTimestamp.toNumber()
  createdTimestamp = createdTimestamp.toNumber()

  const imageUrl = ipfsUrl(image || DEFAULT_MEETUP_IMAGE);

  return {
    id,
    title,
    description,
    location,
    tags,
    image,
    startTimestamp,
    endTimestamp,
    createdTimestamp,
    organizer,
    imageUrl
  }
}

class Contract {
  constructor() {
    this.instance = null
  }

  setContractInstance(instance) {
    this.instance = instance

    this.instance.allEvents()
    .watch((error, log) => {
      if (error) {
        console.error(error)
        return false
      }

      console.log('Event', log)
    })
  }

  createMeetup({
    title,
    description,
    location,
    tags,
    image,
    startTimestamp,
    endTimestamp
  }) {
    if (!this.instance) {
      return Promise.reject()
    }

    return new Promise((resolve, reject) => {
      this.instance.createMeetup(
        title,
        description,
        location,
        tags,
        image,
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

  editMeetup({
    id,
    title,
    description,
    location,
    tags,
    image,
    startTimestamp,
    endTimestamp
  }) {
    if (!this.instance) {
      return Promise.reject()
    }

    return new Promise((resolve, reject) => {
      this.instance.editMeetup(
        id,
        title,
        description,
        location,
        tags,
        image,
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
    if (!this.instance) {
      return Promise.reject()
    }

    return new Promise((resolve, reject) => {
      this.instance.getAllMeetupHashes.call(
      (error, meetupHashes) => {
        if (error) return reject(error)
        console.log(meetupHashes)

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

  getMeetupById(id) {
    if (!this.instance) {
      return Promise.reject()
    }

    return new Promise((resolve, reject) => {
      this.instance.getMeetupByHash.call(
      id,
      (error, result) => {
        if (error) return reject(error)

        resolve(meetupArrayToObject(result))
      })
    })
  }

  deleteMeetupById(id) {
    if (!this.instance) {
      return Promise.reject()
    }

    return new Promise((resolve, reject) => {
      this.instance.deleteMeetupByHash(
      id,
      (error, result) => {
        if (error) return reject(error)

        resolve()
      })
    })
  }
}

function setupWeb3() {
  const Web3 = require('web3')
  const web3 = new Web3()

  const providerUrl = 'https://kovan.infura.io:443'
  const provider = new Web3.providers.HttpProvider(providerUrl)
  web3.setProvider(provider)

  return web3
}

function init() {
  contract = new Contract()

  if (!(window.web3 instanceof Object)) {
    console.info('web3 object not found')
    //alert('web3 object not found')

    window.web3 = setupWeb3()
  }

  if (web3.currentProvider.isMetaMask !== true) {
    //alert('Please install MetaMask Extension for access.')
    //return false;
  }

  if (!web3.eth.defaultAccount) {
    web3.eth.defaultAccount = web3.eth.accounts[0]
  }

  if (!web3.eth.defaultAccount) {
    console.error('No default account set')
  }

  const MeetupContract = web3.eth.contract(abiArray)

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
