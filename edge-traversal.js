const { objectCriteria } = require('./util')

const Traversal = require('./traversal')
const VertexTraversal = require('./vertex-traversal')

class EdgeTraversal extends Traversal {
  next() {
      return this
  }
  outV() {
      return new VertexTraversal(this.session, this, `outV()`, true)
  }
  inV() {
      return new VertexTraversal(this.session, this, `inV()`, true)
  }
  bothV() {
      return new VertexTraversal(this.session, this, `bothV()`, true)
  }
  where(criteria) {
      return new EdgeTraversal(this.session, this, `select distinct(*) from (${this.toString()}) WHERE ${objectCriteria(criteria)}`, false)
  }
}

module.exports = EdgeTraversal