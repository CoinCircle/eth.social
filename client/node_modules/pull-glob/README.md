# pull-glob

streaming extended glob.

use with [pull-stream](https://github.com/dominictarr/pull-stream)

## examples

``` js
var pull = require('pull-stream')
var glob = require('pull-glob')

function glob_log (name, pattern) {
  pull(glob(pattern), pull.collect(function (err, ary) {
    if(err) throw err
    console.log('name:', name, 'pattern:', pattern)
    console.log(ary)
  })
}


glob_log('current dir', '.')
glob_log('js in current dir', '*.js')
glob_log('everything under current dir', '**')
glob_log('all js under current dir', '**/*.js')
glob_log('parent directories', '...')
glob_log('hidden files', '.../.*')
glob_log('available modules', '.../node_modules/*')
glob_log('local package files', '.../{package,component}.json')
```

## stopping early

because this module uses pull-streams, it's lazy,
so you can do queries like the following:

``` js
//find the first package.json in a parent directory.
pull(glob('.../package.json'), pull.take(1), log())
```

And you will retrive only the first item, and _will
not do any extra IO_. This is hugely useful when
doing a large traversal...

## collect node_module tree

``` js
pull(
  glob('**/node_modules/*/package.json'),
  pull.collect(function (e, arr) {
    console.log(arr)
  })
)
```

## License

MIT




