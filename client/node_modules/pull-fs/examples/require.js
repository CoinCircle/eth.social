var pfs = require('./')
var path = require('path')
var pull = require('pull-stream')
var fs = require('fs')

function requireResolve (req, rel, cb) {
  //relative
  if(req[0] === '.')
    return cb(null, path.resolve(rel, req))
  //absolute
  else if(req[0] === '/')
    return cb(null, req)

  var parts = req.split(path.sep)
  var tail
  var name = parts.shift()
  if(parts.length)
    tail = parts.join(path.sep) + (path.extname(req) ? '' :'.js')

  pull(
    pfs.ancestors(rel), //./, ../, ../../, etc
    pfs.resolve('./node_modules'),
    pfs.star(),
  //separate unique files
    pull.filter(function (data) {
      return path.basename(data) === name
    }),
    pull.asyncMap(function (e, cb) {
      fs.readFile(
        path.resolve(e, 'package.json'), 'utf-8',
        function (err, data) {
          try {
            data = JSON.parse(data)
          } catch (err) {
            return cb(null) //don't stop
          }
          cb(null, path.resolve(e, tail ? tail : (data.main || 'index.js')))
        })
    }),
    pull.asyncMap(function (file) {
      fs.stat(file, function (err, stat) {
        if(stat && stat.isFile())
          cb(null, file)
        else cb(null, null)
      })
    }),
    pull.filter(),
    pull.find(function(e) {return e}, cb)
  )
}

if(!module.parents) {
  requireResolve(process.argv[2], process.cwd(), console.log)
}


