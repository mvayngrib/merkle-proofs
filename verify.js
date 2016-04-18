var flat = require('flat-tree')

module.exports = MerkleProofVerifier

/**
 * @param {Array} opts.proof      list of nodes including root
 * @param {Function} opts.leaf    leaf hasher function
 * @param {Function} opts.parent  parent hasher function
 */
function MerkleProofVerifier (opts) {
  if (!(this instanceof MerkleProofVerifier)) return new MerkleProofVerifier(opts)

  var proof = opts.proof
  var root = proof[proof.length - 1]
  this._rootIdx = root.index
  this._nodeByIndex = {}

  for (var i = 0; i < proof.length; i++) {
    var node = proof[i]
    this._nodeByIndex[node.index] = node
  }

  this._leaf = opts.leaf
  this._parent = opts.parent
}

MerkleProofVerifier.prototype.verify = function (leaf, idx) {
  var cur = this._leaf({ data: new Buffer(leaf) })
  var curIdx = idx
  while (curIdx !== this._rootIdx) {
    var siblingIdx = flat.sibling(idx)
    var sibling = this._nodeByIndex[siblingIdx]
    if (!sibling) return false

    var left = idx < siblingIdx ? cur : sibling
    var right = left === cur ? sibling : cur

    cur = this._parent(
      { hash: left.hash || left },
      { hash: right.hash || right }
    )

    curIdx = flat.parent(curIdx)
  }

  return true
}
