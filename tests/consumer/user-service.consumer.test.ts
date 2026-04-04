import { describe, it, expect } from 'vitest';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import { UserApiClient } from '../../src/consumer/api-client';

const { eachLike, integer, string, regex, datetime } = MatchersV3;

const provider = new PactV4({
  consumer: 'OrderService',
  provider: 'UserService',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

describe('User Service Consumer Pact', () => {
  describe('GET /api/users', () => {
    it('returns a paginated list of users', async () => {
      await provider
        .addInteraction()
        .given('users exist')
        .uponReceiving('a request for the user list')
        .withRequest('GET', '/api/users', (builder) => {
          builder.query({ page: '1', limit: '10' });
        })
        .willRespondWith(200, (builder) => {
          builder.headers({ 'Content-Type': 'application/json; charset=utf-8' });
          builder.jsonBody({
            data: eachLike({
              id: integer(1),
              name: string('Alice Johnson'),
              email: regex(/^[^@]+@[^@]+\.[^@]+$/, 'alice@example.com'),
              role: regex(/^(admin|user|viewer)$/, 'admin'),
              createdAt: datetime("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2025-01-15T10:00:00.000Z'),
            }),
            total: integer(3),
            page: integer(1),
            limit: integer(10),
          });
        })
        .executeTest(async (mockServer) => {
          const client = new UserApiClient(mockServer.url);
          const result = await client.getUsers(1, 10);

          expect(result.data).toBeInstanceOf(Array);
          expect(result.data.length).toBeGreaterThan(0);
          expect(result.data[0]).toHaveProperty('id');
          expect(result.data[0]).toHaveProperty('name');
          expect(result.data[0]).toHaveProperty('email');
          expect(result.data[0]).toHaveProperty('role');
          expect(result.total).toBeGreaterThan(0);
          expect(result.page).toBe(1);
        });
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns a single user by ID', async () => {
      await provider
        .addInteraction()
        .given('user with ID 1 exists')
        .uponReceiving('a request for user 1')
        .withRequest('GET', '/api/users/1')
        .willRespondWith(200, (builder) => {
          builder.headers({ 'Content-Type': 'application/json; charset=utf-8' });
          builder.jsonBody({
            id: integer(1),
            name: string('Alice Johnson'),
            email: string('alice@example.com'),
            role: string('admin'),
            createdAt: datetime("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2025-01-15T10:00:00.000Z'),
          });
        })
        .executeTest(async (mockServer) => {
          const client = new UserApiClient(mockServer.url);
          const user = await client.getUserById(1);

          expect(user.id).toBe(1);
          expect(user.name).toBeTruthy();
          expect(user.email).toContain('@');
        });
    });

    it('returns 404 for a non-existent user', async () => {
      await provider
        .addInteraction()
        .given('user with ID 999 does not exist')
        .uponReceiving('a request for non-existent user 999')
        .withRequest('GET', '/api/users/999')
        .willRespondWith(404, (builder) => {
          builder.headers({ 'Content-Type': 'application/json; charset=utf-8' });
          builder.jsonBody({
            error: string('User not found'),
            status: integer(404),
          });
        })
        .executeTest(async (mockServer) => {
          const client = new UserApiClient(mockServer.url);
          await expect(client.getUserById(999)).rejects.toThrow('User not found');
        });
    });
  });

  describe('POST /api/users', () => {
    it('creates a new user', async () => {
      await provider
        .addInteraction()
        .given('the user service is available')
        .uponReceiving('a request to create a new user')
        .withRequest('POST', '/api/users', (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({
            name: 'New User',
            email: 'newuser@example.com',
            role: 'user',
          });
        })
        .willRespondWith(201, (builder) => {
          builder.headers({ 'Content-Type': 'application/json; charset=utf-8' });
          builder.jsonBody({
            id: integer(4),
            name: string('New User'),
            email: string('newuser@example.com'),
            role: string('user'),
            createdAt: datetime("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2025-06-01T12:00:00.000Z'),
          });
        })
        .executeTest(async (mockServer) => {
          const client = new UserApiClient(mockServer.url);
          const user = await client.createUser({
            name: 'New User',
            email: 'newuser@example.com',
            role: 'user',
          });

          expect(user.id).toBeDefined();
          expect(user.name).toBe('New User');
          expect(user.email).toBe('newuser@example.com');
          expect(user.role).toBe('user');
        });
    });

    it('returns 400 for invalid request body', async () => {
      await provider
        .addInteraction()
        .given('the user service is available')
        .uponReceiving('a request to create a user with missing fields')
        .withRequest('POST', '/api/users', (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({ name: 'Incomplete' });
        })
        .willRespondWith(400, (builder) => {
          builder.headers({ 'Content-Type': 'application/json; charset=utf-8' });
          builder.jsonBody({
            error: string('name, email, and role are required'),
            status: integer(400),
          });
        })
        .executeTest(async (mockServer) => {
          const client = new UserApiClient(mockServer.url);
          await expect(client.createUser({ name: 'Incomplete' } as never)).rejects.toThrow();
        });
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deletes an existing user', async () => {
      await provider
        .addInteraction()
        .given('user with ID 2 exists')
        .uponReceiving('a request to delete user 2')
        .withRequest('DELETE', '/api/users/2')
        .willRespondWith(204)
        .executeTest(async (mockServer) => {
          const client = new UserApiClient(mockServer.url);
          await expect(client.deleteUser(2)).resolves.toBeUndefined();
        });
    });
  });
});
