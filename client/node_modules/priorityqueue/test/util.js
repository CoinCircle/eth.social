// Fisher-Yates, in-place
function shuffle(array) {
  let n = array.length;
  while (n) {
    let i = Math.floor(Math.random() * n--);
    [array[n], array[i]] = [array[i], array[n]];
  }

  return array;
}
export { shuffle };

function range(sz, frm = 0) {
  let ret = [];
  for (let i = frm; i < sz; ++i) ret.push(i);
  return ret;
}
export { range };
