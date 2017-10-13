const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const pify = require('pify')

const dbpath = path.resolve(__dirname, '../sqlite.db')
const db = new sqlite3.Database(dbpath)

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS posts (tx_hash TEXT, block_number INTEGER, id INTEGER, ipfs_hash TEXT, title TEXT, description TEXT, location TEXT, tags TEXT, image TEXT, start INTEGER, end INTEGER, created INTEGER, updated INTEGER, organizer TEXT, deleted INTEGER)')
})

//db.close()

function upsert ({
  txHash,
  blockNumber,
  id,
  ipfsHash,
  title,
  description,
  location,
  tags,
  image,
  start,
  end,
  created,
  updated,
  organizer,
  deleted
}) {
  const stmt = db.prepare('INSERT OR REPLACE INTO posts SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS(SELECT 1 FROM posts WHERE tx_hash = ?)')
  stmt.run(
    txHash,
    blockNumber,
    id,
    ipfsHash,
    title,
    description,
    location,
    tags,
    image,
    start,
    end,
    created,
    updated,
    organizer,
    deleted,
    txHash
  )
  console.log(`INSERT OR REPLACE: txHash=${txHash}`)
  stmt.finalize()
}

async function query (sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (error, rows) => {
      if (error) {
        console.error(error)
        return false
      }

      resolve(rows)
    })
  })
}

module.exports = {
  upsert,
  query
}
