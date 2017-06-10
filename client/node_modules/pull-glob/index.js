var pfs  = require('pull-fs')
var pull = require('pull-stream')
var path = require('path')

var glob = module.exports = function (x) {

  var rest = path.normalize(x).split('/')
  var stream

  var pipe = []

  if(rest[0] == '...') {
    pipe.push(pfs.ancestors())
    rest.shift()
  } else if(rest[0] === '~' || rest[0] === '') {
    pipe.push(pull.values([rest.shift() ? process.env.HOME : '/']))
  } else {
    pipe.push(pull.values(['.']))
  }

  //this should be tidied up.
  //need a more betterer glob parser
  //that handles escapes...
  rest.forEach(function (e) {
    if('**' === e) {
      pipe.push(pfs.starStar())
    } else if(/[*?{}]/.test(e)) {
      //literal
      e = e
        .split('.').join('\\.')
        .split('?').join('.')
        .split(/({.*?})/).map(function (e, i) {
        if(i % 2)
          return e.replace('{', '(?:')
                  .replace('}', ')')
                  .split(',').join('|')
        return e
      }).join('')

      var x = new RegExp('^'+e.split('*').join('.*')+'$')
      pipe.push(pfs.star(x))
    } else if(e === '')
      //will only happen in the last position
      //if you do */
      pipe.push(pfs.isDirectory())
    else
      pipe.push(pull(pfs.resolve(e), pfs.exists()))
  })

  return pull.apply(null, pipe)
}

