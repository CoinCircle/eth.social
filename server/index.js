const server = require('./src/server')
const watcher = require('./src/watcher')

watcher.start()
server.start()
