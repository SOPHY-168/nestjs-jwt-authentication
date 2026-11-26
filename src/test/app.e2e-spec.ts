import { randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { UserEntity } from '../users/entities/user.entity';

describe('Persistent authentication (e2e)', () => {
  let app: INestApplication | undefined;
  const id = randomUUID();
  const email = `${id}@example.com`;
  const password = 'test-fixture-password';

  async function startApp() {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const instance = module.createNestApplication();
    instance.setGlobalPrefix('api/v1');
    instance.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await instance.init();
    return instance;
  }

  beforeAll(async () => {
    app = await startApp();
    await app
      .get(DataSource)
      .getRepository(UserEntity)
      .insert({
        id,
        name: 'Test User',
        email,
        passwordHash: await hash(password, 4),
      });
  });

  afterAll(async () => {
    if (app) {
      try {
        await app.get(DataSource).getRepository(UserEntity).delete(id);
      } finally {
        await app.close();
      }
    }
  });

  it('persists sessions across restarts, rotates once, and revokes on logout', async () => {
    const base = '/api/v1/auth';
    let http = request(app!.getHttpServer());
    await http
      .post(base + '/login')
      .send({ email, password: 'incorrect' })
      .expect(401);
    const { body: login } = await http
      .post(base + '/login')
      .send({ email, password })
      .expect(200);

    await app!.close();
    app = undefined;
    app = await startApp();
    http = request(app.getHttpServer());
    const { body: profile } = await http
      .get(base + '/profile')
      .set('Authorization', `Bearer ${login.accessToken}`)
      .expect(200);
    expect(profile).toEqual({
      id,
      email,
      name: 'Test User',
      sessionId: expect.any(String),
    });

    const attempts = await Promise.all([
      http.post(base + '/refresh').send({ refreshToken: login.refreshToken }),
      http.post(base + '/refresh').send({ refreshToken: login.refreshToken }),
    ]);
    expect(attempts.map((result) => result.status).sort()).toEqual([200, 401]);
    const rotated = attempts.find((result) => result.status === 200)!.body;
    await http
      .post(base + '/logout')
      .send({ refreshToken: rotated.refreshToken })
      .expect(200);
    await http
      .get(base + '/profile')
      .set('Authorization', `Bearer ${rotated.accessToken}`)
      .expect(401);
  });
});
