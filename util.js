require('generator-extensions')

const gefer = require('gefer')
const { RecordID } = require('orientjs')

const escapeField = s => s.replace(/\`.*?\`|\[.*?\]|[@\w]+/g, (m => m[0] === '[' || m[0] === '`' || m[0] === '@' ? m : '`' + m + '`'))
const escapeObj = obj => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key.startsWith('`') ? key : '`' + key + '`', value]))
const eq = require('lodash/eq')

const track = async fn => {
  const stack = new Error('at...').stack
  try {
    return await fn()
  } catch (err) {
    err.stack += stack
    throw err
  }
}

const promisify = obj => {
  obj.then = (resolved, rejected) => {
    obj.then = null
    obj.session.then(
      () => resolved(obj),
      rejected
    )
  }
  return obj
}

const iterate = async function* (result) {
  const subject = gefer.subject()
  result
    .on('data', subject.next)
    .on('error', subject.error)
    .on('end', subject.return)
  yield* subject()
}

const one = async (iterator) => {
  for await (let item of iterator) return item
}

const whatChanged = (record, data) => {
  const changed = Object.entries(data).filter(([key, value]) => !eq(value, record[key]))
  if (changed.length) return Object.fromEntries(changed)
  else return null
}

const toRid = (record) => {
  if (record instanceof RecordID) return record.toString()
  if (record && record['@rid']) return record['@rid'].toString()
  if (typeof record === 'string') return record
}

const toRidArray = (records) => {
  if (!records) return null
  if (Array.isArray(records)) return records.map(toRid)
  return toRidArray([records])
}

const parens = (arr, delim) => {
  if (arr.length === 1) return arr[0]
  return `(${arr.join(delim)})`
}
const groups = {
  $and: (v) => parens(v.map(objectCriteria), ' AND '),
  $or: (v) => parens(v.map(objectCriteria), ' OR ')
}
const ops = {
  $eq: (f, v) => `\`${f}\` = ${JSON.stringify(v)}`,
  $ne: (f, v) => `\`${f}\` != ${JSON.stringify(v)}`,
  $gt: (f, v) => `\`${f}\` > ${JSON.stringify(v)}`,
  $gte: (f, v) => `\`${f}\` >= ${JSON.stringify(v)}`,
  $lt: (f, v) => `\`${f}\` < ${JSON.stringify(v)}`,
  $lte: (f, v) => `\`${f}\` <= ${JSON.stringify(v)}`,
  $in: (f, v) => `\`${f}\` in ${JSON.stringify(v)}`,
  $nin: (f, v) => `\`${f}\` not in ${JSON.stringify(v)}`
}

const querify = (v) => (v instanceof RecordID || typeof v === 'string' || v[Symbol.iterator]) ? { '@rid': toRidArray(v) } : v

const objectCriteria = (obj) => {
  if (Object.keys(obj).some(x => x.startsWith('$'))) {
    return parens(Object.entries(obj).map(([key, value]) => {
      if (!key.startsWith('$')) throw new Error('Cannot mix directives with fields')
      return groups[key](value)
    }), ' AND ')
  } else {
    return parens(Object.entries(obj).map(([field, value]) => {
      if (value && Object.keys(value).some(x => x.startsWith('$'))) {
        return parens(Object.entries(value).map(([key, value]) => {
          if (!key.startsWith('$')) throw new Error('Cannot mix directives with fields')
          return ops[key](field, value)
        }), ' AND ')
      } else {
        return ops.$eq(field, value)
      }
    }), ' AND ')
  }
}

module.exports = {
  track,
  escapeField,
  escapeObj,
  promisify,
  iterate,
  one,
  whatChanged,
  toRid,
  toRidArray,
  parens,
  groups,
  ops,
  querify,
  objectCriteria
}
