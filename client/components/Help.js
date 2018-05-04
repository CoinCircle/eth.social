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
         <h3>Install MetaMask</h3>
          <p>Install <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a> Chrome extension to sign transactions.</p>

        <h3>Set Ethereum Provider</h3>
        <p>Currently eth.social is in a testing and development phase so it's not available in the mainnet yet.</p>

        <p>Set ethereum provider to "<a href="https://rinkeby.etherscan.io/" target="_blank" rel="noopener noreferrer">Rinkeby Test Network</a>".</p>
        <img src="https://gateway.ipfs.io/ipfs/QmWcSbLSXdRtWEDQFve6CJ92j673Ddy9RmuzqRJSKDgBsr" width="300" />

        <h3>Deposit ether</h3>
        <p>Use the <a href="https://faucet.rinkeby.io" target="_blank" rel="noopener noreferrer">Rinkeby faucet</a> if you don't already have ether in your account.</p>

        </div>
        <div className="column sixteen wide">
          <h2 className="ui huge header">
            Support
          </h2>
          <div className="ui divider"></div>
        </div>
        <p><a
            href="https://github.com/coincircle/eth.social/issues/new" target="_blank" rel="noopener noreferrer">
          Submit Issue / Feature Request
      </a></p>
      </div>
    )
  }
}

module.exports = Help
