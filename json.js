const isRid = o => (o && o.constructor && o.constructor.name === 'RecordID') || (typeof o === 'string' && /^#\d+:\d+$/.test(o))
const isRidBag = o => o && o.constructor && o.constructor.name === 'ORidBag'
const isEdgeLink = key => /^(out|in)_/.test(key)

/**
 * @module Json
 */
/**
 * Replaces Record IDs with Record references.
 * @param {Array.<object>} records
 * @return {Array.<object>}
 */
const link = records => {
  const objs = {}
  for (const record of records) {
    objs[record['@rid']] = {...record}
  }
  for (const record of Object.values(objs)) {
    for (const key in record) {
      const value = record[key]
      if (isRidBag(value) || (Array.isArray(value) && isEdgeLink(key))) {
        const foreignRecords = []
        for (const rid of value) {
          const foreignRecord = objs[rid]
          if (foreignRecord) foreignRecords.push(foreignRecord)
        }
        record[key] = foreignRecords
      } else if (isRid(value)) {
        if (key === '@rid') record[key] = value.toString()
        else record[key] = objs[value]
      }
    }
  }
  return Object.values(objs)
}

/**
 * Replaces Record references with Record IDs
 * @param {Array.<object>} records 
 * @return {Array.<object>}
 */
const unlink = records => {
  const objs = {}
  for (const record of records) {
    objs[record['@rid']] = {...record}
  }
  for (const record of Object.values(objs)) {
    for (const key in record) {
      const value = record[key]

      if (Array.isArray(value)) {
        const foreignKeys = []
        for (const foreignRecord of value) {
          if (foreignRecord && foreignRecord['@rid']) {
            foreignKeys.push(foreignRecord['@rid'])
          } else {
            // It may be an array of something else
            foreignKeys.push(foreignRecord)
          }
        }
        record[key] = foreignKeys
      } else if (value && value['@rid']) {
        record[key] = value['@rid']
      }
    }
  }
  return Object.values(objs)
}

/**
 * JSON stringifies a graph which may have circular references.
 * @param {Array.<object>} records 
 * @param {object} opts JSON.stringify options
 */
const stringify = (records, opts) => JSON.stringify(unlink(records), opts)

/**
 * Parses JSON into a graph which may have circular references
 * @param {string} json 
 */
const parse = (json) => link(JSON.parse(json))
module.exports = {
  link,
  unlink,
  stringify,
  parse
}