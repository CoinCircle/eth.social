var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

db.serialize(function() {
  db.run("CREATE TABLE posts (tx_hash TEXT, block_number INTEGER, id INTEGER, ipfs_hash TEXT, title TEXT, description TEXT)");

});

//db.close();

function upsert ({txtHash, blockNumber, id, ipfsHash, title, description}) {
  var stmt = db.prepare("INSERT INTO posts VALUES (?, ?, ?, ?, ?, ?)");
  for (var i = 0; i < 10; i++) {
      stmt.run(txtHash, blockNumber, id, ipfsHash, title, description);
  }
  stmt.finalize();

  db.each("SELECT * FROM posts", function(err, row) {
      console.log(row)
  });
}

module.exports = { upsert }
