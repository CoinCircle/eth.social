let apiUrl = 'https://api.eth.social'

if (window.location.hostname === 'localhost') {
  apiUrl = 'http://localhost:8001'
}

async function getPosts () {
  const response = await fetch(`${apiUrl}/posts`)
  const json = await response.json()
  return json.posts
}

module.exports = {
  getPosts
}
