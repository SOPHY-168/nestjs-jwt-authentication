import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'auth_sessions' })
export class AuthSessionEntity {
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'PK_auth_sessions' })
  id: string;

  @Index('IDX_auth_sessions_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.sessions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_auth_sessions_user',
  })
  user: Relation<UserEntity>;

  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    length: 64,
  })
  refreshTokenHash: string;

  @Column({
    name: 'previous_token_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  previousTokenHash: string | null;

  @Index('IDX_auth_sessions_expires_at')
  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt: Date;

  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    nullable: true,
  })
  revokedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
