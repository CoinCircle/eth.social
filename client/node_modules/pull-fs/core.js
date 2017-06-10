var pull = require('pull-stream')
var fs   = require('fs')
var path = require('path')
var Read = require('pull-file')
var Write = require('pull-write-file')

var readdir =
exports.readdir =
function (dir, match, ignore) {
  var ls, ended = false
  match = (
    !match                           ? null
  : 'function' === typeof match      ? match
  : 'function' === typeof match.test ? match.test.bind(match)
  :                                    null
  )
  return function (abort, cb) {
    if(ended || abort) {
      cb(ended = ended || abort)
    }
    else if(!ls)
      fs.readdir(dir, function (err, _ls) {
        if(err && err.code == 'ENOTDIR') cb(ended = true)
        else if(err)             cb(ended = err)
        else if(!_ls.length) cb(ended = true)
        else {
          if(match)
            _ls = _ls.filter(match)
          ls = _ls.map(function (f) {
            return path.resolve(dir, f)
          })
          if(ls.length)
            cb(null, ls.shift())
          else
            cb(true)
        }
      })
    else if(!ls.length) cb(ended = true)
    else                cb(null, ls.shift())
  }
}

var blocksize = 512

var read = exports.read = Read
var write = exports.write = Write

var exists =
exports.exists =
function (test) {
  test = test || function (e) {
    return !!e
  }
  return pull(
    pull.asyncMap(function (e, cb) {
      fs.stat(e, function (err, stat) {
        if(stat && test(stat))
          cb(null, e)
        else
          cb(null, null)
      })
    }),
    pull.filter(Boolean)
  )
}

function testStat(test) {
  return function () {
    return exists(test)
  }
}


var isFile = 
exports.isFile =
testStat(function (e) { return e.isFile() })

var isDirectory = 
exports.isDirectory =
testStat(function (e) { return e.isDirectory() })

var isBlockDevice = 
exports.isBlockDevice =
testStat(function (e) { return e.isBlockDevice() })

var isCharacterDevice = 
exports.isCharacterDevice =
testStat(function (e) { return e.isCharacterDevice() })

var isSymbolicLink = 
exports.isSymbolicLink =
testStat(function (e) { return e.isSymbolicLink() })

var isFIFO = 
exports.isFIFO =
testStat(function (e) { return e.isFIFO() })

var isSocket = 
exports.isSocket =
testStat(function (e) { return e.isSocket() })


