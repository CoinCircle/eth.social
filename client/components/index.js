const React = require('react')
const ReactDOM = require('react-dom')

const App = require('./App')
const { init } = require('../services/contract')

// wait for MetaMask to inject Web3
window.addEventListener('load', async () => {
  try {
    await init()
  } catch (error) {
    console.error(error)
  }

  main()
})

function main() {
  ReactDOM.render(
    <App />,
    document.getElementById('root')
  );
}
