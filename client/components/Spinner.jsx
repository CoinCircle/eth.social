const React = require('react')
const ReactDOM = require('react-dom')

function Spinner(props) {
  let loader = null

  if (props.show) {
    loader = <div className="ui active inline loader"></div>
  }

  return (
    loader
  )
}

module.exports = Spinner
