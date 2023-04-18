const dbUtils = require('./support/db');

// Allow mongodb-memory-server-core to download the mongodb binaries before specs
module.exports = async () => {
  // eslint-disable-next-line no-console
  console.log(
    'Letting mongodb-memory-server-core download the mongodb binaries, this can take a short while on first runs'
  );
  const mongod = await dbUtils.start();
  const mongo = await dbUtils.db(mongod);
  await mongo.close();
  await mongod.stop();
};
