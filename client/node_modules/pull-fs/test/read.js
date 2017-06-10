
var fs = require('fs')
var pfs = require('../')
var pull = require('pull-stream')

var file = __dirname + '/../core.js'
var text = fs.readFileSync(file, 'utf-8')

var test = require('tape')

test('read a file', function (t) {
  pull(
    pfs.read(file, 'utf-8'),
    pull.through(console.log),
    pull.collect(function (err, ary) {
      t.equal(ary.join(''), text)
      t.end()
    })
  )
})

test('write a file', function (t) {
  var lines = ['a\n', 'b\n', 'c\n'].map(Buffer)
  var file = '/tmp/test-pfs-write'
  pull(
    pull.values(lines),
    pfs.write(file, function (err) {
      if(err) throw err
      fs.readFile(file, 'utf-8', function (err, data) {
        if(err) throw err
        t.equal(data, lines.join(''))
        t.end()
      })
    })
  )
})


