
var flat = require('flat-tree')

module.exports = MerkleProofGenerator

function MerkleProofGenerator (nodes) {
  if (!(this instanceof MerkleProofGenerator)) return new MerkleProofGenerator(nodes)

  this._indicesInProof = {}
  this._nodes = new Array(nodes.length)

  // order tree
  for (var i = 0; i < nodes.length; i++) {
    var idx = nodes[i].index
    this._nodes[idx] = nodes[i]
  }

  var height = nearestPowerOf2(nodes.length)
  this._rootIdx = Math.pow(2, height - 1) - 1
  this._root = this._nodes[this._rootIdx]
}

MerkleProofGenerator.prototype.add = function (idx) {
  // accept node or index as parameter
  if (typeof idx !== 'number') {
    if (this._nodes.indexOf(idx) === -1) throw new Error('expected index or node')

    idx = idx.index
  }

  var path = getPath(idx, this._rootIdx)
  var proofNodes = []
  for (var i = 0; i < path.length; i++) {
    var nodeIdx = path[i]
    if (!(nodeIdx in this._indicesInProof)) {
      this._indicesInProof[nodeIdx] = true
      proofNodes.push(this._nodes[nodeIdx])
    }
  }

  return proofNodes
}

function getPath (idx, rootIdx) {
  var path = []
  while (idx !== rootIdx) {
    path.push(flat.sibling(idx))
    idx = flat.parent(idx)
  }

  return path
}

function nearestPowerOf2 (n) {
  return Math.ceil(Math.log(n) / Math.log(2))
}
