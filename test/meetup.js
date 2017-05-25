var Meetup = artifacts.require('./Meetup.sol')

contract('Meetup', function(accounts) {
  it('should create a meetup', async function() {
    //console.log(accounts)
    var organizer = accounts[0]

    try {
      var instance = await Meetup.deployed()

      // create meetup
      var result = await instance.createMeetup('Hello', 'World')
      assert.ok(result.tx)

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
    } catch(error) {
      assert.equal(error, undefined)
    }
  })
})
