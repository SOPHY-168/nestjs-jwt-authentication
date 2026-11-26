import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { AuthSessionEntity } from './entities/auth-session.entity';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    UsersModule,

    TypeOrmModule.forFeature([AuthSessionEntity]),

    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),

        signOptions: {
          algorithm: 'HS256',
          expiresIn: Number(config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN')),
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, AuthSessionService, JwtStrategy, JwtAuthGuard],

  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}
