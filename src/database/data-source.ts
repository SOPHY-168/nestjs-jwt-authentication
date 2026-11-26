import { DataSource } from 'typeorm';

import { UserEntity } from '../users/entities/user.entity';
import { AuthSessionEntity } from '../auth/entities/auth-session.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),

  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: [UserEntity, AuthSessionEntity],

  migrations: [__dirname + '/migrations/*{.ts,.js}'],

  migrationsTableName: 'typeorm_migrations',

  synchronize: false,
  logging: false,
});
