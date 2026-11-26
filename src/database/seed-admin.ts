import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';

import { AppDataSource } from './data-source';
import { UserEntity } from '../users/entities/user.entity';

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (
    !email ||
    !password ||
    password.length < 12 ||
    bcrypt.truncates(password)
  ) {
    throw new Error(
      'Provide SEED_ADMIN_EMAIL and a strong ' +
        'SEED_ADMIN_PASSWORD (at least 12 characters and at most 72 bytes)',
    );
  }

  await AppDataSource.initialize();

  try {
    const repository = AppDataSource.getRepository(UserEntity);

    const existingUser = await repository.findOne({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (existingUser) {
      console.log('Seed user already exists.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = repository.create({
      id: randomUUID(),
      name: 'Administrator',
      email: email.trim().toLowerCase(),
      passwordHash,
      isActive: true,
    });

    await repository.save(user);

    console.log('Admin seed user created successfully.');
    console.log(`Email: ${user.email}`);
  } finally {
    await AppDataSource.destroy();
  }
}

seedAdmin().catch((error) => {
  console.error('Admin seed failed:', error);
  process.exitCode = 1;
});
