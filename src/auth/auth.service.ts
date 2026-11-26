import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service';
import { AuthSessionService } from './auth-session.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserEntity } from '../users/entities/user.entity';
import { AuthSessionEntity } from './entities/auth-session.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionService: AuthSessionService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !user.isActive || bcrypt.truncates(dto.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);

    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { session, refreshToken } = await this.sessionService.create(user.id);

    return this.generateTokens(user, session, refreshToken);
  }

  private async generateTokens(
    user: UserEntity,
    session: AuthSessionEntity,
    refreshToken: string,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      sid: session.id,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken,

      expiresIn: Number(
        this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
      ),

      refreshExpiresIn: Math.max(
        0,
        Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
      ),
    };
  }

  async refresh(refreshToken: string) {
    const result = await this.sessionService.rotate(refreshToken);

    return this.generateTokens(
      result.user,
      result.session,
      result.refreshToken,
    );
  }

  async logout(refreshToken: string) {
    await this.sessionService.revoke(refreshToken);

    return {
      message: 'Logout successfully',
    };
  }
}
