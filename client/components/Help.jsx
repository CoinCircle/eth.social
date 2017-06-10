const React = require('react')
const ReactDOM = require('react-dom')

class Help extends React.Component {
  render() {
    return (
      <div className="ui grid stackable padded">
        <div className="column sixteen wide">
          <h2 className="ui huge header">
            Help
          </h2>
          <div className="ui divider"></div>
        </div>
        <div className="column sixteen wide">
          <p>Use <a href="https://metamask.io/" target="_blank">MetaMask</a> Chrome extension and set provider to <code>https://testnet.infura.io:80</code>.</p>
        </div>
      </div>
    )
  }
}

module.exports = Help
