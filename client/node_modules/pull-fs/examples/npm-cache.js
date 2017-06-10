
var pull = require('pull-stream')
var pfs  = require('../')
var path = require('path')

pull(
  pull.values([path.join(process.env.HOME, '.npm')]),
  pfs.star(),
  pfs.star(),
  pfs.isDirectory(), //get all the cached modules
  pull.drain(console.log)
)
