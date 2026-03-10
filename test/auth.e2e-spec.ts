import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import cookieParser from 'cookie-parser';

describe('Auth E2E', () => {
  jest.setTimeout(60000);

  let app: INestApplication;
  let refreshCookie: string;

  const testUser = {
    email: 'e2e@test.com',
    name: 'E2E User',
    password: 'StrongPass123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/sign-up', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send(testUser);

    console.log(res.body);

    expect(res.status).toBe(201);
  });

  it('POST /auth/sign-in', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send(testUser)
      .expect(200);

    expect(res.body.email).toBe(testUser.email);

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();

    refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken'));
  });

  it('POST /auth/refresh', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [refreshCookie])
      .expect(200);

    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /auth/logout', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', [refreshCookie])
      .expect(200);
  });

  it('POST api/auth/sign-in wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      })
      .expect(401);
  });
});
