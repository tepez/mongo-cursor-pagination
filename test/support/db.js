const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server-core');
const mongoist = require('mongoist');

function start() {
  return MongoMemoryServer.create({
    binary: { version: '4.0.28' },
  });
}

async function db(mongod, driver = null) {
  const uri = mongod.getUri();
  if (driver === 'mongoist') {
    return mongoist(uri);
  }
  return MongoClient.connect(uri);
}

module.exports = {
  db,
  start,
};
