const camelcaseKeys = require('camelcase-keys')
const {query} = require('./store')

async function queryPosts () {
  let results = await query('SELECT * FROM POSTS')
  results = results.map(x => camelcaseKeys(x))
  return results
}

module.exports = queryPosts
