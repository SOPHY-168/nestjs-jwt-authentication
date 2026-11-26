import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import { UserEntity } from './users/entities/user.entity';
import { AuthSessionEntity } from './auth/entities/auth-session.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        type: 'postgres',

        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow<string>('DB_PORT')),

        username: config.getOrThrow<string>('DB_USERNAME'),

        password: config.getOrThrow<string>('DB_PASSWORD'),

        database: config.getOrThrow<string>('DB_DATABASE'),

        entities: [UserEntity, AuthSessionEntity],

        synchronize: false,
        logging: false,
      }),
    }),

    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
