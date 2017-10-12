const Koa = require('koa')
const route = require('koa-path-match')()
const cors = require('koa-cors')
const serve = require('koa-static')
const koaSwagger = require('koa2-swagger-ui')
const app = new Koa()

app.use(require('kcors')())

app.use(serve(__dirname + '/../public'))

app.use(koaSwagger({
  title: 'eth.social API',
  routePrefix: '/v1',
  swaggerOptions: {
    url: 'swagger.yml',
    validatorUrl: false
  },
  hideTopbar: true
}))

app.use(route('/').get(ctx => {
  ctx.body = {}
}))

const port = process.env.PORT || 8000

function start () {
  app.listen(port, () => {
    console.log(`listening on port ${port}`)
  })
}

module.exports = { start }
