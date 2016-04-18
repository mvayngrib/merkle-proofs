var Transform = require('readable-stream').Transform
var util = require('util')
var generator = require('./generator')

module.exports = MerkleTreeProof

function MerkleTreeProof (opts) {
  if (!(this instanceof MerkleTreeProof)) return new MerkleTreeProof(opts)
  if (!opts || !opts.nodes) throw new Error('expected merkle tree nodes')
  this._generator = generator(opts.nodes)
  this.destroyed = false
  var hwm = opts.highWaterMark || 16
  Transform.call(this, {objectMode: true, highWaterMark: hwm})
}

util.inherits(MerkleTreeProof, Transform)

MerkleTreeProof.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true
  if (err) this.emit('error', err)
  this.emit('close')
}

MerkleTreeProof.prototype._transform = function (idx, enc, cb) {
  var nodes = this._generator.add(idx)
  for (var i = 0; i < nodes.length; i++) this.push(nodes[i])
  cb()
}

// MerkleTreeProof.prototype.end = function () {
//   this.push(this._generator._root)
//   return Transform.prototype.end.apply(this, arguments)
// }
