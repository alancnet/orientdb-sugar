const nest = require('nest-literal')
const { objectCriteria } = require('./util')

const Traversal = require('./traversal')
const VertexTraversal = require('./vertex-traversal')

class EdgeTraversal extends Traversal {
  /** @return {VertexTraversal} */
  outV() {
    this._next(VertexTraversal, nest`outV()`, { chainable: true })
  }
  /** @return {VertexTraversal} */
  inV() {
    this._next(VertexTraversal, nest`inV()`, { chainable: true })
  }
  /** @return {VertexTraversal} */
  bothV() {
    this._next(VertexTraversal, nest`bothV()`, { chainable: true })
  }
}

module.exports = EdgeTraversal