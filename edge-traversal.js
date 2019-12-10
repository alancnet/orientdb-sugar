const nest = require('nest-literal')
const { objectCriteria } = require('./util')

const Traversal = require('./traversal')

/**
 * Represents a traversal from an edge
 */
class EdgeTraversal extends Traversal {
  /** @return {VertexTraversal} */
  outV() {
    return this._next(VertexTraversal, nest`outV()`, { chainable: true })
  }
  /** @return {VertexTraversal} */
  inV() {
    return this._next(VertexTraversal, nest`inV()`, { chainable: true })
  }
  /** @return {VertexTraversal} */
  bothV() {
    return this._next(VertexTraversal, nest`bothV()`, { chainable: true })
  }
}

module.exports = EdgeTraversal
const VertexTraversal = require('./vertex-traversal')
