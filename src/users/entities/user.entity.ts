import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { AuthSessionEntity } from '../../auth/entities/auth-session.entity';

@Entity({ name: 'users' })
@Unique('UQ_users_email', ['email'])
export class UserEntity {
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'PK_users' })
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @OneToMany(() => AuthSessionEntity, (session) => session.user)
  sessions: AuthSessionEntity[];

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
