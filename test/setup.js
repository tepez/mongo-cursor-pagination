const dbUtils = require('./support/db');

// Allow mongodb-memory-server-core to download the mongodb binaries before specs
module.exports = async () => {
  // eslint-disable-next-line no-console
  console.log(
    'Letting mongodb-memory-server-core download the mongodb binaries, this can take a short while on first runs'
  );
  const mongod = await dbUtils.start();
  const db = await dbUtils.db(mongod);
  await db.client.close();
  await mongod.stop();
};
