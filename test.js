
var crypto = require('crypto')
var tape = require('tape')
var merkleStream = require('merkle-tree-stream')
var proofStream = require('./')

tape('prove one', function (t) {
  var stream = merkleStream({
    leaf: function (leaf) {
      return hash([leaf.data])
    },
    parent: function (a, b) {
      return hash([a.hash, b.hash])
    }
  })

  var nodes = []
  stream.on('data', function (node) {
    nodes.push(node)
  })

  stream.write('a')
  stream.write('b')
  stream.write('c')
  stream.finalize()

  stream.end()

  stream.on('end', function () {
    var pstream = proofStream({ nodes:nodes })
    var proof = []
    pstream.on('data', function (node) {
      proof.push(node)
    })

    pstream.on('end', function () {
      t.equal(proof.length, 2)
      t.equal(proof[0].index, 2)
      t.equal(proof[1].index, 5)
      t.end()
    })

    pstream.write(0)
    pstream.end()
  })
})

tape('prove multiple', function (t) {
  var stream = merkleStream({
    leaf: function (leaf) {
      return hash([leaf.data])
    },
    parent: function (a, b) {
      return hash([a.hash, b.hash])
    }
  })

  var nodes = []
  stream.on('data', function (node) {
    nodes.push(node)
  })

  stream.write('a')
  stream.write('b')
  stream.write('c')
  stream.write('d')
  stream.write('e')
  stream.finalize()

  stream.end()

  stream.on('end', function () {
    var pstream = proofStream({ nodes:nodes })
    var proof = []
    pstream.on('data', function (node) {
      proof.push(node)
    })

    pstream.on('end', function () {
      t.equal(proof.length, 6)
      t.deepEqual(proof.map(function (node) {
        return node.index
      }), [
        2, 5, 11, 6, 1, 4
      ])

      t.end()
    })

    pstream.write(0)
    pstream.write(4)
    pstream.write(6)
    pstream.end()
  })
})

function hash (list) {
  var sha = crypto.createHash('sha256')
  for (var i = 0; i < list.length; i++) sha.update(list[i])
  return sha.digest()
}
