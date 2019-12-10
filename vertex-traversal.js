const { objectCriteria } = require('./util')

const Traversal = require('./traversal')
const EdgeTraversal = require('./edge-traversal')

class VertexTraversal extends Traversal {
  next() {
    return this
  }
  out(...edgeNames) {
    return new VertexTraversal({ parent: this, expression: `out(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, chainable: true })
  }
  outE(...edgeNames) {
    return new EdgeTraversal({ parent: this, expression: `outE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, chainable: true })
  }
  in(...edgeNames) {
    return new VertexTraversal({ parent: this, expression: `in(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, chainable: true })
  }
  inE(...edgeNames) {
    return new EdgeTraversal({ parent: this, expression: `inE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, chainable: true })
  }
  both(...edgeNames) {
    return new VertexTraversal({ parent: this, expression: `both(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, chainable: true })
  }
  bothE(...edgeNames) {
    return new EdgeTraversal({ parent: this, expression: `bothE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, chainable: true })
  }
  where(criteria) {
    return new VertexTraversal({ parent: this, expression: `select distinct(*) from (${this.toString()}) WHERE ${objectCriteria(criteria)}`, chainable: false })
  }
  select(fields) {
    return new Traversal({ parent: this, expression: `select ${fields.map(escapeField).join(', ')} from (${this.toString()})`, chainable: false, terminal: true })
  }
}

module.exports = VertexTraversal