var pull = require('pull-stream')
var glob = require('./')

function glob_log (name, pattern) {
  pull(glob(pattern), pull.collect(function (err, ary) {
    if(err) throw err
    console.log('name:', name, pattern)
    console.log(ary)
  }))
}


glob_log('current dir', '.')
glob_log('js in current dir', '*.js')
glob_log('everything under current dir', '**')
glob_log('all js under current dir', '**/*.js')
glob_log('parent directories', '...')
glob_log('hidden files', '.../.*')
glob_log('available modules', '.../node_modules/*')
glob_log('local package files', '.../{package,component}.json')

