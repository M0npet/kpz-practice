import { Connection, createConnection } from 'typeorm';

import config from './config/ormconfig';

// One shared promise for the whole process. Both src/index.ts and the tests call
// dbCreateConnection(); without the cache the second call raced the first one: TypeORM
// replaces a 'default' connection that is not connected yet and the first one leaks.
let connectionPromise: Promise<Connection | null> | null = null;

export const dbCreateConnection = (): Promise<Connection | null> => {
  if (!connectionPromise) {
    connectionPromise = createConnection(config)
      .then((conn) => {
        console.log(
          `Database connection success. Connection name: '${conn.name}' Database: '${conn.options.database}'`,
        );
        return conn;
      })
      .catch((err) => {
        console.log(err);
        connectionPromise = null;
        return null;
      });
  }
  return connectionPromise;
};
