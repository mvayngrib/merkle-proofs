var flat = require('flat-tree')

module.exports = merkleProofVerifier

/**
 * @param {Array} opts.proof      list of nodes including root
 * @param {Function} opts.leaf    leaf hasher function
 * @param {Function} opts.parent  parent hasher function
 */
function merkleProofVerifier (opts) {
  var proof = opts.proof
  var root = proof[proof.length - 1]
  var rootIdx = root.index
  var nodeByIndex = {}

  for (var i = 0; i < proof.length; i++) {
    var node = proof[i]
    nodeByIndex[node.index] = node
  }

  var leafHasher = opts.leaf
  var parentHasher = opts.parent

  return function verify (leaf, idx) {
    var cur = leafHasher({ data: new Buffer(leaf) })
    while (idx !== rootIdx) {
      var siblingIdx = flat.sibling(idx)
      var sibling = nodeByIndex[siblingIdx]
      if (!sibling) return false

      var left = idx < siblingIdx ? cur : sibling
      var right = left === cur ? sibling : cur

      cur = parentHasher(
        wrap(left),
        wrap(right)
      )

      idx = flat.parent(idx)
    }

    return equals(cur, root.hash)
  }
}

function wrap (hash) {
  return hash.hash ? hash : { hash: hash }
}

function equals (a, b) {
  if (a.length !== b.length) return false

  for (var i = 0, l = a.length; i < l; i++) {
    if (a[i] !== b[i]) return false
  }

  return true
}
