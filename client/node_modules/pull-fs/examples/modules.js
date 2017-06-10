var pull = require('pull-stream')
var pfs  = require('../')
var path = require('path')
var DepthFirst = require('pull-traverse').depthFirst

pull(
  DepthFirst(process.cwd(), function (dir) {
    return pull(
      pfs.readdir(path.resolve(dir, './node_modules'), null, true),
      pull.filter()
    )
  }),
  pull.map(function (e) {
    return path.relative(process.cwd(), e)
  }),
  pull.drain(console.log, function (err) {
    if(err) throw err
  })
)

