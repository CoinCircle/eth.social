#! /usr/bin/env node

var pull = require('pull-stream')

if(!process.argv[2])
  throw new Error("expected glob: eg, '**/*.js'")
s = require('./')(process.argv[2])

if(/-f|--first/.test(process.argv[3]))
  s = pull(s, pull.take(1))

pull(s, pull.drain(console.log))

