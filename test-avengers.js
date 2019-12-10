const { create } = require('./index')
const json = require('./json')
async function main() {
  const client = create({
    host: 'localhost',
    port: 2424,
    username: 'root',
    password: 'root',
    manageSchema: true
  })

  const db = client.db('test2')

  const traversal = db.vertex('Film').traverse()
    .where({name: 'Avengers'}).select()
    .inE('ActedIn').select()
    .outV().select()
    .outE('ActedIn').select()
    .inV().select()

  console.log(traversal.toString())
  const data = await traversal.link()
  console.dir(json.stringify(data), {depth: 5})

  // await traversal.execute().toArray()

  process.exit(0)
  client.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
