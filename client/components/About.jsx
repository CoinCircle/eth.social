const React = require('react')
const ReactDOM = require('react-dom')

class About extends React.Component {
  render() {
    return (
      <div className="ui grid padded">
        <div className="row">
          <h2 className="ui header">
            About
          </h2>
        </div>
        <div className="row">
          <p>
            eth.social is a place for posting social event,<br />
            in a completely decentralized way by being built on top of the Ethereum blockchain and hosted on IPFS.
          </p>
        </div>
        <div className="row">
          <p>
            <a href="https://github.com/miguelmota/eth.social" target="_blank">
              <i className="icon large github"></i>
            </a>
          </p>
        </div>
      </div>
    )
  }
}

module.exports = About
