var moment = require('moment')
var Meetup = artifacts.require('./Meetup.sol')

contract('Meetup', function(accounts) {
  it('should create a meetup', async function() {
    //console.log(accounts)
    var organizer = accounts[0]

    try {
      var instance = await Meetup.deployed()

      var lastEvent = () => {
        return new Promise((resolve, reject) => {
          instance.allEvents()
          .watch((error, log) => {
            if (error) return reject(error)
            resolve(log)
          })
        })
      }

      var title = 'Hello'
      var desc = 'World'
      var start = moment().unix()
      var end = moment().add(1, 'hour').unix()

      // create meetup
      var result = await instance.createMeetup(title, desc, start, end)
      assert.ok(result.tx)

      var eventObj = await lastEvent()
      assert.equal(eventObj.event, 'MeetupCreated')

      // get all meetup hashes for organizer
      var meetupHashes = await instance.getMeetupHashes.call(organizer)
      console.log(meetupHashes)
      assert.equal(meetupHashes.length, 1)
      assert.equal(typeof meetupHashes[0], 'string')

      // get meetup details for meetup hash
      var meetup = await instance.getMeetup.call(meetupHashes[0])
      console.log(meetup)
      var [title, description] = meetup
      assert.equal(title, 'Hello')
      assert.equal(description, 'World')

      // delete meetup
      var deleted = await instance.deleteMeetup(meetupHashes[0])
      assert.ok(result.tx)

      var eventObj = await lastEvent()
      assert.equal(eventObj.event, 'MeetupDeleted')

      meetupHashes = await instance.getMeetupHashes.call(organizer)
      assert.equal(meetupHashes.length, 0)
      //assert.notOk(meetup)

      try {
        // check meetup is deleted
        meetup = await instance.getMeetup.call(meetupHashes[0])
        console.log('this should not work', meetup)

      } catch(error) {
        assert.ok(error)
      }
    } catch(error) {
      assert.equal(error, undefined)
    }
  })
})
