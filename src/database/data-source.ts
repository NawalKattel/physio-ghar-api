import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/typeorm.config';

// Used by the TypeORM CLI: pnpm migration:run / migration:generate.
export default new DataSource(buildDataSourceOptions(process.env));
