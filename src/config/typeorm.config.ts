import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy';

const ext = __filename.endsWith('.ts') ? 'ts' : 'js';

// Shared by the Nest app and the TypeORM CLI (src/database/data-source.ts).
export function buildDataSourceOptions(
  env: NodeJS.ProcessEnv,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    // .ts under ts-node (migration CLI), .js from dist — never the emitted .d.ts files.
    entities: [`${__dirname}/../**/*.entity.${ext}`],
    migrations: [`${__dirname}/../database/migrations/*.${ext}`],
    namingStrategy: new SnakeNamingStrategy(),
    // Schema changes go through migrations only.
    synchronize: false,
    migrationsRun: false,
    logging: env.DB_LOGGING === 'true',
    // Store and compare everything in UTC; convert to the therapist's zone at the edges.
    extra: { options: '-c timezone=UTC' },
  };
}
