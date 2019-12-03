const { objectCriteria } = require('./util')

const Traversal = require('./traversal')
const EdgeTraversal = require('./edge-traversal')

class VertexTraversal extends Traversal {
  next() {
      return this
  }
  out(...edgeNames) {
      return new VertexTraversal(this.session, this, `out(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
  }
  outE(...edgeNames) {
      return new EdgeTraversal(this.session, this, `outE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
  }
  in(...edgeNames) {
      return new VertexTraversal(this.session, this, `in(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
  }
  inE(...edgeNames) {
      return new EdgeTraversal(this.session, this, `inE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
  }
  both(...edgeNames) {
      return new VertexTraversal(this.session, this, `both(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
  }
  bothE(...edgeNames) {
      return new EdgeTraversal(this.session, this, `bothE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
  }
  where(criteria) {
      return new VertexTraversal(this.session, this, `select distinct(*) from (${this.toString()}) WHERE ${objectCriteria(criteria)}`, false)
  }
}

module.exports = VertexTraversal