'use strict'

var test = require('tape')
var concat = require('concat-stream')
var through = require('through2')
var Multiplex = require('./')
var net = require('net')
var chunky = require('chunky')
var pump = require('pump')

test('one way piping work with 2 sub-streams', function (t) {
  var plex1 = new Multiplex()
  var stream1 = plex1.createStream()
  var stream2 = plex1.createStream()

  var plex2 = new Multiplex(function onStream (stream, id) {
    stream.pipe(collect())
  })

  plex1.pipe(plex2)

  stream1.write(new Buffer('hello'))
  stream2.write(new Buffer('world'))
  stream1.end()
  stream2.end()

  var pending = 2
  var results = []

  function collect () {
    return concat(function (data) {
      results.push(data.toString())
      if (--pending === 0) {
        results.sort()
        t.equal(results[0].toString(), 'hello')
        t.equal(results[1].toString(), 'world')
        t.end()
      }
    })
  }
})

test('two way piping works with 2 sub-streams', function (t) {
  var plex1 = new Multiplex()

  var plex2 = new Multiplex(function onStream (stream, id) {
    var uppercaser = through(function (chunk, e, done) {
      this.push(new Buffer(chunk.toString().toUpperCase()))
      this.end()
      done()
    })
    stream.pipe(uppercaser).pipe(stream)
  })

  plex1.pipe(plex2).pipe(plex1)

  var stream1 = plex1.createStream()
  var stream2 = plex1.createStream()

  stream1.pipe(collect())
  stream2.pipe(collect())

  stream1.write(new Buffer('hello'))
  stream2.write(new Buffer('world'))

  var pending = 2
  var results = []

  function collect () {
    return concat(function (data) {
      results.push(data.toString())
      if (--pending === 0) {
        results.sort()
        t.equal(results[0].toString(), 'HELLO')
        t.equal(results[1].toString(), 'WORLD')
        t.end()
      }
    })
  }
})

test('stream id should be exposed as stream.name', function (t) {
  var plex1 = new Multiplex()
  var stream1 = plex1.createStream('5')
  t.equal(stream1.name, '5')

  var plex2 = new Multiplex(function onStream (stream, id) {
    t.equal(stream.name, '5')
    t.equal(id, '5')
    t.end()
  })

  plex1.pipe(plex2)

  stream1.write(new Buffer('hello'))
  stream1.end()
})

test('stream id can be a long string', function (t) {
  var plex1 = new Multiplex()
  var stream1 = plex1.createStream('hello-yes-this-is-dog')
  t.equal(stream1.name, 'hello-yes-this-is-dog')

  var plex2 = new Multiplex(function onStream (stream, id) {
    t.equal(stream.name, 'hello-yes-this-is-dog')
    t.equal(id, 'hello-yes-this-is-dog')
    t.end()
  })

  plex1.pipe(plex2)

  stream1.write(new Buffer('hello'))
  stream1.end()
})

test('destroy', function (t) {
  var plex1 = new Multiplex()
  var stream1 = plex1.createStream()

  var plex2 = new Multiplex(function onStream (stream, id) {
    stream.on('error', function (err) {
      t.equal(err.message, '0 had an error')
      t.end()
    })
  })

  plex1.pipe(plex2)

  stream1.write(new Buffer('hello'))
  stream1.destroy(new Error('0 had an error'))
})

test('testing invalid data error', function (t) {
  var plex = new Multiplex()

  plex.on('error', function (err) {
    if (err) {
      t.equal(err.message, 'Incoming message is too big')
      t.end()
    }
  })
  // a really stupid thing to do
  plex.write(Array(50000).join('\xff'))
})

test('overflow', function (t) {
  t.plan(2)
  var plex1 = new Multiplex()
  var plex2 = new Multiplex({limit: 10})

  plex2.on('stream', function (stream) {
    stream.on('error', function (err) {
      t.equal(err.message, 'Incoming message is too big')
    })
  })

  plex2.on('error', function (err) {
    if (err) {
      t.equal(err.message, 'Incoming message is too big')
    }
  })

  plex1.pipe(plex2).pipe(plex1)

  var stream = plex1.createStream()

  stream.write(new Buffer(11))
})

test('2 buffers packed into 1 chunk', function (t) {
  var plex1 = new Multiplex()
  var plex2 = new Multiplex(function (b) {
    b.pipe(concat(function (body) {
      t.equal(body.toString('utf8'), 'abc\n123\n')
      t.end()
      server.close()
      plex1.end()
    }))
  })
  var a = plex1.createStream(1337)
  a.write('abc\n')
  a.write('123\n')
  a.end()

  var server = net.createServer(function (stream) {
    plex2.pipe(stream).pipe(plex2)
  })
  server.listen(0, function () {
    var port = server.address().port
    plex1.pipe(net.connect(port)).pipe(plex1)
  })
})

test('chunks', function (t) {
  var times = 100
  ;(function chunk () {
    var collect = collector(function () {
      if (--times === 0) t.end()
      else chunk()
    })
    var plex1 = new Multiplex()
    var stream1 = plex1.createStream()
    var stream2 = plex1.createStream()

    var plex2 = new Multiplex(function onStream (stream, id) {
      stream.pipe(collect())
    })

    plex1.pipe(through(function (buf, enc, next) {
      var bufs = chunky(buf)
      for (var i = 0; i < bufs.length; i++) this.push(bufs[i])
      next()
    })).pipe(plex2)

    stream1.write(new Buffer('hello'))
    stream2.write(new Buffer('world'))
    stream1.end()
    stream2.end()
  })()

  function collector (cb) {
    var pending = 2
    var results = []

    return function () {
      return concat(function (data) {
        results.push(data.toString())
        if (--pending === 0) {
          results.sort()
          t.equal(results[0].toString(), 'hello')
          t.equal(results[1].toString(), 'world')
          cb()
        }
      })
    }
  }
})

test('prefinish + corking', function (t) {
  var plex = new Multiplex()
  var async = false

  plex.on('prefinish', function () {
    plex.cork()
    process.nextTick(function () {
      async = true
      plex.uncork()
    })
  })

  plex.on('finish', function () {
    t.ok(async, 'finished')
    t.end()
  })

  plex.end()
})

test('quick message', function (t) {
  var plex2 = new Multiplex()
  var plex1 = new Multiplex(function (stream) {
    stream.write('hello world')
  })

  plex1.pipe(plex2).pipe(plex1)

  setTimeout(function () {
    var stream = plex2.createStream()
    stream.on('data', function (data) {
      t.same(data, new Buffer('hello world'))
      t.end()
    })
  }, 100)
})

test('if onstream is not passed, stream is emitted', function (t) {
  var plex1 = new Multiplex()
  var plex2 = new Multiplex()

  plex1.pipe(plex2).pipe(plex1)

  plex2.on('stream', function (stream, id) {
    t.ok(stream, 'received stream')
    t.ok(id, 'has id')
    stream.write('hello world')
    stream.end()
  })

  var stream = plex1.createStream()
  stream.on('data', function (data) {
    t.same(data, new Buffer('hello world'))
    stream.end()
    setTimeout(() => t.end(), 1000)
  })
})

test('half close a muxed stream', function (t) {
  var plex1 = new Multiplex()
  var plex2 = new Multiplex()

  plex1.pipe(plex2)
       .pipe(plex1)

  plex2.on('stream', function (stream, id) {
    t.ok(stream, 'received stream')
    t.ok(id, 'has id2')

    // let it flow
    stream.on('data', function () {})

    stream.on('end', function () {
      t.end()
    })

    stream.on('error', function (err) {
      t.notOk(err)
    })

    stream.write(new Buffer('hello world'))

    stream.end()
  })

  var stream = plex1.createStream()

  stream.on('data', function (data) {
    t.same(data, new Buffer('hello world'))
  })

  stream.on('error', function (err) {
    t.notOk(err)
  })

  stream.on('end', function () {
    stream.end()
  })
})

test('half close a half closed muxed stream', function (t) {
  var plex1 = new Multiplex({halfOpen: true})
  var plex2 = new Multiplex({halfOpen: true})

  plex1.nameTag = 'plex1:'
  plex2.nameTag = 'plex2:'

  plex1.pipe(plex2)
       .pipe(plex1)

  plex2.on('stream', function (stream, id) {
    t.ok(stream, 'received stream')
    t.ok(id, 'has id2')

    stream.on('data', function (data) {
      t.same(data, new Buffer('some data'))
    })

    stream.on('end', function () {
      stream.write(new Buffer('hello world'))
      stream.end()
    })

    stream.on('error', function (err) { t.notOk(err) })
  })

  var stream = plex1.createStream()

  stream.on('data', function (data) {
    t.same(data, new Buffer('hello world'))
  })

  stream.on('error', function (err) {
    t.notOk(err)
  })

  stream.on('end', function () {
    t.end()
  })

  stream.write(new Buffer('some data'))

  stream.end()
})

test('underlying error is propagated to muxed streams', function (t) {
  t.plan(4)
  var plex1 = new Multiplex()
  var plex2 = new Multiplex()

  var socket

  plex2.on('stream', function (stream) {
    stream.on('error', function (err) {
      t.ok(err)
    })

    stream.on('close', function () {
      t.pass()
    })

    socket.destroy()
  })

  var stream1to2 = plex1.createStream(1337)

  stream1to2.on('error', function (err) {
    t.ok(err)
  })

  stream1to2.on('close', function () {
    t.pass()
  })

  var server = net.createServer(function (stream) {
    pump(plex2, stream)
    pump(stream, plex2)
    server.close()
  })

  server.listen(0, function () {
    var port = server.address().port
    socket = net.connect(port)

    pump(plex1, socket)
    pump(socket, plex1)
  })
})
