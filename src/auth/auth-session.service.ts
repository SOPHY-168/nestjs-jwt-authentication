import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, Repository } from 'typeorm';

import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

import { UserEntity } from '../users/entities/user.entity';
import { AuthSessionEntity } from './entities/auth-session.entity';

@Injectable()
export class AuthSessionService {
  constructor(
    @InjectRepository(AuthSessionEntity)
    private readonly sessionRepository: Repository<AuthSessionEntity>,

    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private matchesHash(token: string, expectedHash: string | null): boolean {
    if (!expectedHash) return false;

    const actual = Buffer.from(this.hashToken(token), 'hex');

    const expected = Buffer.from(expectedHash, 'hex');

    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  private parseToken(token: string): string {
    const parts = token.split('.');

    if (
      parts.length !== 2 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        parts[0],
      ) ||
      !/^[0-9a-f]{128}$/i.test(parts[1])
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return parts[0];
  }

  private generateToken(sessionId: string): string {
    const secret = randomBytes(64).toString('hex');
    return `${sessionId}.${secret}`;
  }

  async create(userId: string) {
    const sessionId = randomUUID();
    const refreshToken = this.generateToken(sessionId);

    const expiresIn = Number(
      this.configService.getOrThrow<string>('REFRESH_TOKEN_EXPIRES_IN'),
    );

    const session = this.sessionRepository.create({
      id: sessionId,
      userId,
      refreshTokenHash: this.hashToken(refreshToken),
      previousTokenHash: null,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      revokedAt: null,
    });

    await this.sessionRepository.save(session);

    return {
      session,
      refreshToken,
    };
  }

  async rotate(refreshToken: string) {
    const sessionId = this.parseToken(refreshToken);

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(AuthSessionEntity);

      const session = await repository
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .where('session.id = :sessionId', {
          sessionId,
        })
        .getOne();

      if (!session || session.revokedAt) {
        throw new UnauthorizedException('Invalid or revoked session');
      }

      if (session.expiresAt <= new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      const valid = this.matchesHash(refreshToken, session.refreshTokenHash);

      if (!valid) {
        // Reject mismatches without modifying the session.
        // A separate token-family/replay strategy can be
        // added in a production hardening lesson.
        throw new UnauthorizedException('Invalid or reused refresh token');
      }

      // Check the linked user before issuing new tokens.
      const user = await manager.findOne(UserEntity, {
        where: {
          id: session.userId,
          isActive: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newRefreshToken = this.generateToken(session.id);

      session.previousTokenHash = session.refreshTokenHash;

      session.refreshTokenHash = this.hashToken(newRefreshToken);

      await repository.save(session);

      return {
        session,
        user,
        refreshToken: newRefreshToken,
      };
    });
  }

  async findActive(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        userId,
      },
    });

    return Boolean(
      session && !session.revokedAt && session.expiresAt > new Date(),
    );
  }

  async revoke(refreshToken: string): Promise<void> {
    const sessionId = this.parseToken(refreshToken);

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(AuthSessionEntity);

      const session = await repository
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .where('session.id = :sessionId', {
          sessionId,
        })
        .getOne();

      if (
        !session ||
        session.revokedAt ||
        session.expiresAt <= new Date() ||
        !this.matchesHash(refreshToken, session.refreshTokenHash)
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      session.revokedAt = new Date();

      await repository.save(session);
    });
  }
}
