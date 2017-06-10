var path = require('path')
var pull = require('pull-stream')
var core  = require('./core')
var fs    = require('fs')
var DepthFirst = require('pull-traverse').depthFirst

var ancestors = exports.ancestors = function (dir) {
  dir = dir || process.cwd()
  var paths = []

  while(dir) {
    paths.push(dir)
    dir = path.dirname(dir)
    if(dir === '/') {
      paths.push(dir) 
      break
    }
  }

  return pull.values(paths)
}

var star = exports.star = function (match) {
  return pull(
    pull.map(function (dir) {
      return core.readdir(dir, match)
    }),
    pull.flatten(),
    pull.filter()
  )
}

var starStar =
exports.starStar =
function (match) {
  var seen = {}
  return pull(
    pull.map(function (dir) {
      var first = true
      return DepthFirst(path.resolve(dir), function (_dir) {
        return pull(
          core.readdir(_dir, match, true),
          pull.filter(function (e) {
            if(seen[e]) return false
            return seen[e] = true
          })
        )
      })
    }),
    pull.flatten(),
    pull.filter()
  )
}

var resolve = exports.resolve = function (rel) {
 return pull.map(function (dir) { //map to $dir/node_modules
    if(rel)
      return path.resolve(dir, rel)
    return path.resolve(dir)
  })
}

var relative = exports.relative = function (rel) {
  rel = rel || process.cwd()
  return pull.map(function (file) {
    return path.relative(rel, file)
  })
}

var absolute = exports.absolute =
function () {
  return resolve()
}

var readFile =
exports.readFile = function (parse) {
  return pull.asyncMap(function (file, cb) {
    fs.readFile(file, 'utf-8', function (err, data) {
      if(err) return cb(err) 
      try {
         data = parse ? parse(data) : data
      } catch (err) {
        return cb(err)
      }
      return cb(null, data)
    })
  })
}

if(!module.parent) {
  pull(
    pull.values(['.']),
    starStar(),
    pull.drain(console.log)
  )
}


