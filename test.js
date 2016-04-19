
var crypto = require('crypto')
var tape = require('tape')
var merkleStream = require('merkle-tree-stream')
var shmerkle = require('./')
var proofStream = shmerkle.proofStream
var proofGenerator = shmerkle.proofGenerator
var verifier = shmerkle.verifier
var MERKLE_OPTS = {
  leaf: function (leaf) {
    return hash([leaf.data])
  },
  parent: function (a, b) {
    return hash([a.hash, b.hash])
  }
}

proveVerify({
  data: ['a', 'b', 'c', 'd', 'e'],
  prove: ['a'],
  // notProven: ['b', 'c', 'd', 'e'],
  proofIndices: [2, 5, 11, 7]
})

proveVerify({
  data: ['a', 'b', 'c', 'd', 'e'],
  prove: ['a', 'd'],
  // notProven: ['b', 'c', 'e'],
  proofIndices: [2, 5, 11, 4, 1, 7]
})

function proveVerify (opts) {
  var data = opts.data
  var valsToProve = opts.prove
  var indicesToProve = valsToProve.map(function (val, idx) {
    return data.indexOf(val) * 2 // leaves are 0, 2, 4, 6, etc.
  })

  // var notProven = opts.notProven
  var proofIndices = opts.proofIndices
  createTree(data, function (err, nodes) {
    if (err) throw err

    // make sure stream and generator get same results
    ;[useStream, useGenerator].forEach(function (prove, i) {
      tape('prove, verify test ' + i, function (t) {
        prove(nodes, indicesToProve, function (err, proof) {
          if (err) throw err

          t.deepEqual(getIndices(proof), proofIndices)
          verify(proof)
        })

        function verify (proof) {
          var verify = verifier({
            leaf: MERKLE_OPTS.leaf,
            parent: MERKLE_OPTS.parent,
            proof: proof
          })

          data.forEach(function (val, idx) {
            var method = valsToProve.indexOf(val) !== -1 ? 'ok' : 'notOk'
            t[method](verify(val, idx * 2))
          })

          t.end()
        }
      })
    })
  })
}

function hash (list) {
  var sha = crypto.createHash('sha256')
  for (var i = 0; i < list.length; i++) sha.update(list[i])
  return sha.digest()
}

function getIndices (nodes) {
  return nodes.map(function (node) {
    return node.index
  })
}

function useStream (nodes, indicesToProve, cb) {
  var pstream = proofStream({ nodes: nodes })
  var proof = []
  pstream.on('data', function (node) {
    proof.push(node)
  })

  pstream.on('end', function () {
    cb(null, proof)
  })

  indicesToProve.forEach(function (idx) {
    pstream.write(idx)
  })

  pstream.end()
}

function useGenerator (nodes, indicesToProve, cb) {
  var gen = proofGenerator(nodes)
  indicesToProve.forEach(function (node) {
    gen.add(node)
  })

  cb(null, gen.proof())
}

function createTree (arr, cb) {
  var stream = merkleStream(MERKLE_OPTS)

  var nodes = []
  stream.on('data', function (node) {
    nodes.push(node)
  })

  arr.forEach(function (data) {
    stream.write(data)
  })

  stream.finalize()
  stream.end()
  stream.on('end', function () {
    cb(null, nodes)
  })
}
