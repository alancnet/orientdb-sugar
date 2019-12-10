const { objectCriteria } = require('./util')

const Traversal = require('./traversal')
const VertexTraversal = require('./vertex-traversal')

class EdgeTraversal extends Traversal {
  next() {
    return this
  }
  outV() {
    return new VertexTraversal({ parent: this, expression: `outV()`, chainable: true })
  }
  inV() {
    return new VertexTraversal({ parent: this, expression: `inV()`, chainable: true })
  }
  bothV() {
    return new VertexTraversal({ parent: this, expression: `bothV()`, chainable: true })
  }
  where(criteria) {
    return new EdgeTraversal({ parent: this, expression: `select distinct(*) from (${this.toString()}) WHERE ${objectCriteria(criteria)}`, chainable: false })
  }
  select(fields) {
    return new Traversal({ parent: this, expression: `select ${fields.map(escapeField).join(', ')} from (${this.toString()})`, chainable: false, terminal: true })
  }
}

module.exports = EdgeTraversal