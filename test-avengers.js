const { create } = require('./index')

async function main() {
  const client = create({
    host: 'localhost',
    port: 2424,
    username: 'root',
    password: 'root',
    manageSchema: true,
    log: console.log
  })

  const db = client.db('test')

  const films = await db.vertex('Film').where().toArray()
  console.log(films)

  client.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
