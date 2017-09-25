var moment = require('moment')
var Meetup = artifacts.require('./Meetup.sol')

var postIpfsHash_A = 'QmfFTftHqmfhjhwBYtKQRPLnHmai8GXZnx3J79BD3bNjds'
var postIpfsHash_B = 'QmUwE6JghehYgbUig4Q9VJ81wAaGhky3ESsQgFXcCyDSRm'

function getLastEvent(instance) {
  return new Promise((resolve, reject) => {
    instance.allEvents()
    .watch((error, log) => {
      if (error) return reject(error)
      resolve(log)
    })
  })
}

contract('Meetup', function(accounts) {
  it('should create a meetup', async function() {
    var organizer = accounts[0]

    try {
      var instance = await Meetup.deployed()

      await instance.createMeetup(postIpfsHash_A)

      var eventObj = await getLastEvent(instance)
      assert.equal(eventObj.event, '_MeetupCreated')

      var [id, org, meetupHash] = await instance.getMeetup(1)
      assert.equal(org, organizer)
      assert.equal(meetupHash, postIpfsHash_A)
      assert.equal(id, 1)
    } catch(error) {
      console.error(error)
      assert.equal(error, undefined)
    }
  })

  it('should be able to edit a meetup', async function() {
    var organizer = accounts[0]

    try {
      var instance = await Meetup.deployed()

      var id = 1
      var [id_2, org_2, meetupHash_2] = await instance.getMeetup(id)
      assert.equal(id_2, id)
      assert.equal(org_2, organizer)
      assert.equal(meetupHash_2, postIpfsHash_A)

      await instance.editMeetup(id, postIpfsHash_B)

      var eventObj = await getLastEvent(instance)
      assert.equal(eventObj.event, '_MeetupUpdated')

      var [id_3, org_3, meetupHash_3] = await instance.getMeetup(id)
      assert.equal(id_3, id)
      assert.equal(org_3, organizer)
      assert.equal(meetupHash_3, postIpfsHash_B)

    } catch(error) {
      console.error(error)
      assert.equal(error, undefined)
    }
  })
})
