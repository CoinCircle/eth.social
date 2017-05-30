const React = require('react')
const ReactDOM = require('react-dom')

const {getInstance} = require('../services/contract')

var meetups = [
{
  "title": "bar"
}
]

function handleError(error) {
  console.error(error)
}

setTimeout(() => {
getInstance()
.getMeetups()
.then(meetups => {
console.log("MET", meetups)
})
.catch(handleError)
}, 500)

class App extends React.Component {
  render() {
    return <ul>{meetups.map((meetup, i) => {
      return <li key={i}>{meetup.title}</li>
    })}</ul>
  }
}

module.exports = App
