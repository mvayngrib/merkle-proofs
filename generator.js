
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
  this._proof = []
}

MerkleProofGenerator.prototype.add = function (idx) {
  // accept node or index as parameter
  if (typeof idx !== 'number') {
    if (this._nodes.indexOf(idx) === -1) throw new Error('expected index or node')

    idx = idx.index
  }

  var added = []
  var path = getPath(idx, this._nodes, this._rootIdx)
  for (var i = 0; i < path.length; i++) {
    var nodeIdx = path[i]
    if (nodeIdx in this._indicesInProof) continue

    this._indicesInProof[nodeIdx] = true
    var node = this._nodes[nodeIdx]
    node = minify(node)
    added.push(node)
    this._proof.push(node)
  }

  return added
}

MerkleProofGenerator.prototype.proof = function () {
  var proof = this._proof.slice()
  proof.push(minify(this._root))
  return proof
}

function getPath (leafIdx, nodeByIdx, rootIdx) {
  var path = []
  while (leafIdx !== rootIdx) {
    var sib = flat.sibling(leafIdx)
    path.push(sib in nodeByIdx ? sib : leafIdx)
    leafIdx = flat.parent(leafIdx)
  }

  return path
}

function nearestPowerOf2 (n) {
  return Math.ceil(Math.log(n) / Math.log(2))
}

function minify (node) {
  return {
    index: node.index,
    hash: node.hash
  }
}
