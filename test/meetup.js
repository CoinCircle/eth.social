var moment = require('moment')
var Meetup = artifacts.require('./Meetup.sol')


contract('Meetup', function(accounts) {
  it('should create a meetup + should delete meetup', async function() {
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
      var location = 'earth'
      var tags = 'foo, bar'
      var image = 'QmQXNrAUm5ykgWuH7PMKM98d5ezMKSqEBg3KSmC1KuQAco'
      var start = moment().unix()
      var end = moment().add(1, 'hour').unix()

      // create meetup
      var result = await instance.createMeetup(
        title,
        desc,
        location,
        tags,
        image,
        start,
        end
      )
      assert.ok(result.tx)

      var eventObj = await lastEvent()
      assert.equal(eventObj.event, 'MeetupCreated')

      // get all meetup hashes
      var meetupHashes = await instance.getAllMeetupHashes.call()
      assert.equal(meetupHashes.length, 1)

      // get all meetup hashes for organizer
      meetupHashes = await instance.getMeetupHashesByOrganizer.call(organizer)
      console.log(meetupHashes)
      assert.equal(meetupHashes.length, 1)
      assert.equal(typeof meetupHashes[0], 'string')

      // get meetup details for meetup hash
      var meetup = await instance.getMeetupByHash.call(meetupHashes[0])
      var [
        id,
        title,
        description,
        location,
        tags,
        image,
        startTimestamp,
        endTimestamp,
        createdTimestamp
      ] = meetup
      console.log(meetup)
      var _organizer = meetup[meetup.length - 1]
      tags = tags.split(',').map(x => x.trim())
      assert.ok(id.length > 0)
      assert.equal(title, 'Hello')
      assert.equal(description, 'World')
      assert.equal(location, 'earth')
      assert.deepEqual(tags, ['foo', 'bar'])
      assert.equal(image, 'QmQXNrAUm5ykgWuH7PMKM98d5ezMKSqEBg3KSmC1KuQAco')
      assert.equal(_organizer, organizer)

      // delete meetup
      var deleted = await instance.deleteMeetupByHash(meetupHashes[0])
      assert.ok(result.tx)

      var eventObj = await lastEvent()
      assert.equal(eventObj.event, 'MeetupDeleted')

      meetupHashes = await instance.getMeetupHashesByOrganizer.call(organizer)
      assert.equal(meetupHashes.length, 0)
      //assert.notOk(meetup)

      try {
        // check meetup is deleted
        meetup = await instance.getMeetup.call(meetupHashes[0])
        console.error('this should not work', meetup)

      } catch(error) {
        assert.ok(error)
      }
    } catch(error) {
      assert.equal(error, undefined)
    }

    meetupHashes = await instance.getAllMeetupHashes.call()
    assert.equal(meetupHashes.length, 0)
  })
})

contract('Meetup', function(accounts) {
  it('should throw if empty title', async function() {
    var organizer = accounts[0]

    try {
      var instance = await Meetup.deployed()

      var title = ''
      var desc = 'foo'
      var location = 'earth'
      var tags = 'bar'
      var image = ''
      var start = moment().unix()
      var end = moment().unix()

      try {
        var result = await instance.createMeetup(
          title,
          desc,
          location,
          tags,
          image,
          start,
          end
        )

        assert.notOk(result)
      } catch(error) {
        assert.ok(error)
      }
    } catch(error) {
      assert.notOk(error)
    }
  })
})

contract('Meetup', function(accounts) {
  it('should throw if empty description', async function() {
    var organizer = accounts[0]

    try {
      var instance = await Meetup.deployed()

      var title = 'foo'
      var desc = ''
      var location = 'earth'
      var tags = 'bar'
      var image = ''
      var start = moment().unix()
      var end = moment().unix()

      try {
        var result = await instance.createMeetup(
          title,
          desc,
          location,
          tags,
          image,
          start,
          end
        )

        assert.notOk(result)
      } catch(error) {
        assert.ok(error)
      }
    } catch(error) {
      assert.notOk(error)
    }
  })
})

contract('Meetup', function(accounts) {
  it('should throw if empty location', async function() {
    var organizer = accounts[0]

    try {
      var instance = await Meetup.deployed()

      var title = 'foo'
      var desc = 'bar'
      var location = ''
      var tags = 'baz'
      var image = ''
      var start = moment().unix()
      var end = moment().unix()

      try {
        var result = await instance.createMeetup(
          title,
          desc,
          location,
          tags,
          image,
          start,
          end
        )

        assert.notOk(result)
      } catch(error) {
        assert.ok(error)
      }
    } catch(error) {
      assert.notOk(error)
    }
  })
})

contract('Meetup', function(accounts) {
  it('should throw if invalid image multihash', async function() {
    var organizer = accounts[0]

    try {
      var instance = await Meetup.deployed()

      var title = 'foo'
      var desc = 'bar'
      var location = 'earth'
      var tags = 'baz'
      var image = 'notvalidhash'
      var start = moment().unix()
      var end = moment().unix()

      try {
        var result = await instance.createMeetup(
          title,
          desc,
          location,
          tags,
          image,
          start,
          end
        )

        assert.notOk(result)
      } catch(error) {
        assert.ok(error)
      }
    } catch(error) {
      assert.notOk(error)
    }
  })
})

contract('Meetup', function(accounts) {
  it('should not throw if empty image', async function() {
    var organizer = accounts[0]

    try {
      var instance = await Meetup.deployed()

      var title = 'foo'
      var desc = 'bar'
      var location = 'earth'
      var tags = 'baz'
      var image = ''
      var start = moment().unix()
      var end = moment().unix()

      try {
        var result = await instance.createMeetup(
          title,
          desc,
          location,
          tags,
          image,
          start,
          end
        )

        assert.ok(result)
      } catch(error) {
        assert.notOk(error)
      }
    } catch(error) {
      assert.notOk(error)
    }
  })
})

contract('Meetup', function(accounts) {
  it('should be able to edit a meetup', async function() {
    var organizer = accounts[0]

    try {
      var instance = await Meetup.deployed()

      var title = 'foo'
      var desc = 'bar'
      var location = 'earth'
      var tags = 'baz'
      var image = 'QmQXNrAUm5ykgWuH7PMKM98d5ezMKSqEBg3KSmC1KuQAco'
      var start = moment().unix()
      var end = moment().add(1, 'hour').unix()

      var result = await instance.createMeetup(
        title,
        desc,
        location,
        tags,
        image,
        start,
        end
      )
      assert.ok(result.tx)

      var meetupHashes = await instance.getAllMeetupHashes.call()
      assert.equal(meetupHashes.length, 1)

      var meetup = await instance.getMeetupByHash.call(meetupHashes[0])
      assert.ok(meetup)

      var id = meetup.id
      var newTitle = 'qux'
      var newDesc = 'corge'
      var newLocation = 'pluto'
      var newTags = 'george'
      var newImage = 'QmdDwGcLoD3jWeGSG955PovB7nHQ6m5RSCcHJqnzenNd3e'
      var newStart = moment().subtract(1, 'hour').unix()
      var newEnd = moment().add(2, 'hour').unix()

      var edit = await instance.editMeetup(
        id,
        NewTitle,
        newDesc,
        newLocation,
        newTags,
        newImage,
        newStart,
        newEnd
      )
      assert.ok(result.tx)

      meetup = await instance.getMeetupByHash.call(meetupHashes[0])
      assert.ok(meetup.id, id)
      assert.ok(meetup.title, newTitle)
      assert.ok(meetup.description, newDescription)
      assert.ok(meetup.location, newLocation)
      assert.ok(meetup.tags, newTags)
      assert.ok(meetup.image, newImage)
      assert.ok(meetup.startTimestamp, newStart)
      assert.ok(meetup.endTimestamp, newEnd)

    } catch(error) {

    }
  });
});
