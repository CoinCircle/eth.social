const apiUrl = `${window.location.protocol}//${window.location.hostname}:${8001}`

async function getPosts () {
  const response = await fetch(`${apiUrl}/posts`)
  const json = await response.json()
  return json.posts
}

module.exports = {
  getPosts
}
