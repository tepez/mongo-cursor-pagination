const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server-core');

function start() {
  return MongoMemoryServer.create({
    binary: { version: '6.0.6' },
  });
}

async function db(mongod, driver = null) {
  const uri = mongod.getUri();
  if (driver === 'mongoist') {
    throw new Error('mongoist testing removed');
  }
  const client = new MongoClient(uri);
  const db = client.db('test_db');
  return {
    db,
    client,
  };
}

module.exports = {
  db,
  start,
};
