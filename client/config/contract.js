const networks = require('../../build/contracts/Meetup.json').networks

var keys = Object.keys(networks)

var config = networks[keys[keys.length - 1]]

module.exports = {
  Meetup: config
}
