// Restores the tasks table to the demo seed: deletes every task and inserts the seed again.
// Users are not touched. usage: npm run db:demo-reset
import 'dotenv/config';
import 'reflect-metadata';
import { createConnection } from 'typeorm';

import config from '../src/orm/config/ormconfig-seed';
import { SeedTasks1792070200000 } from '../src/orm/seeds/1792070200000-SeedTasks';

const main = async () => {
  const connection = await createConnection({ ...config, name: 'default' });
  try {
    await connection.query('DELETE FROM "tasks"');
    const queryRunner = connection.createQueryRunner();
    await new SeedTasks1792070200000().up(queryRunner);
    await queryRunner.release();
    const [{ count }] = await connection.query('SELECT count(*) FROM "tasks"');
    console.log(`Demo tasks restored: ${count}`);
  } finally {
    await connection.close();
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
