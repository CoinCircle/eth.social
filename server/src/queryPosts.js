const camelcaseKeys = require('camelcase-keys')

const {query} = require('./store')
const { ipfsUrl } = require('./ipfs')

const defaultImage =  'QmQXNrAUm5ykgWuH7PMKM98d5ezMKSqEBg3KSmC1KuQAco'

async function queryPosts () {
  let results = await query('SELECT * FROM POSTS WHERE deleted != 1 GROUP BY id ORDER BY start ASC')
  results = results.map(x => {
    x.tags = (x.tags||'').split(',')
    x.imageUrl = ipfsUrl(x.image || defaultImage)
    return camelcaseKeys(x)
  })
  return results
}

module.exports = queryPosts
