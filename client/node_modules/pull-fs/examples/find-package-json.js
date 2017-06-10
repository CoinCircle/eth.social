var pfs = require('../')
var pull = require('pull-stream')

pull(
  pfs.ancestors(), //ancestors of cwd
  pfs.resolve('./package.json'),
  pfs.isFile(),
  pull.find(function (err, file) {
    if(err) throw err
    console.log(file)
  })
)

