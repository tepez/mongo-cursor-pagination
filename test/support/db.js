const MongoClient = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server-core');
const mongoist = require('mongoist');

function start() {
  return new MongoMemoryServer({
    binary: { version: '3.6.13' },
  });
}

async function db(mongod, driver = null) {
  const uri = await mongod.getUri();
  if (driver === 'mongoist') {
    return mongoist(uri);
  }
  return MongoClient.connect(uri);
}

module.exports = {
  db,
  start,
};
