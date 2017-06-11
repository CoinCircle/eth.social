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
          <p>Install <a href="https://metamask.io/" target="_blank">MetaMask</a> Chrome extension to sign transactions.</p>

        <h3>Set Ethereum Provider</h3>
        <p>Currently eth.social is in a testing and development phase so it's not available in the mainnet yet.</p>

        //<p>Set ethereum provider to "<a href="https://www.rinkeby.io/" target="_blank">Rinkeyby Test Network</a>".</p>
        //<img src="https://gateway.ipfs.io/ipfs/QmNoEWq11GLstCJEffpG4ho7jEBJyyKQgzNsD8z5GTq5f5" width="300" />

        <p>Set ethereum provider to "<a href="https://kovan.etherscan.io/" target="_blank">Kovan Test Network</a>".</p>
        <img src="https://gateway.ipfs.io/ipfs/QmRVRjWnWtbUKMAfZ3W8oruaXTeGUiszeA8cH5YMzNHzUV" width="300" />

        <h3>Deposit ether</h3>
        //<p>Use the <a href="https://www.rinkeby.io/" target="_blank">rinkeyby faucet</a> if you don't already have ether in your account.</p>
        <p>Use the <a href="https://gitter.im/kovan-testnet/faucet" target="_blank">Kovan faucet</a> if you don't already have ether in your account.</p>

        </div>
      </div>
    )
  }
}

module.exports = Help
