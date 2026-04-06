import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createApp } from '../../src/provider/server';

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

afterAll(() => {
  server.close();
});

describe('Provider API — GET /api/users', () => {
  it('should return paginated user list', async () => {
    const res = await fetch(`${baseUrl}/api/users?page=1&limit=10`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeInstanceOf(Array);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThan(0);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(10);
  });

  it('should respect limit parameter', async () => {
    const res = await fetch(`${baseUrl}/api/users?limit=1`);
    const data = await res.json();
    expect(data.data).toHaveLength(1);
  });

  it('should have correct user structure', async () => {
    const res = await fetch(`${baseUrl}/api/users`);
    const data = await res.json();
    const user = data.data[0];
    expect(user.id).toBeDefined();
    expect(user.name).toBeTruthy();
    expect(user.email).toContain('@');
    expect(['admin', 'user', 'viewer']).toContain(user.role);
    expect(user.createdAt).toMatch(/^\d{4}-/);
  });
});

describe('Provider API — GET /api/users/:id', () => {
  it('should return user by ID', async () => {
    const res = await fetch(`${baseUrl}/api/users/1`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.id).toBe(1);
    expect(data.name).toBeTruthy();
  });

  it('should return 404 for non-existent user', async () => {
    const res = await fetch(`${baseUrl}/api/users/9999`);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toContain('not found');
  });
});

describe('Provider API — POST /api/users', () => {
  it('should create new user with valid data', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', role: 'user' }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.id).toBeGreaterThan(0);
    expect(data.name).toBe('Test User');
    expect(data.email).toBe('test@example.com');
  });

  it('should return 400 for missing required fields', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Incomplete' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('required');
  });

  it('should return 400 for invalid role', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bad', email: 'bad@test.com', role: 'superadmin' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('role');
  });
});

describe('Provider API — DELETE /api/users/:id', () => {
  it('should delete existing user', async () => {
    const res = await fetch(`${baseUrl}/api/users/2`, { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('should return 404 for deleting non-existent user', async () => {
    const res = await fetch(`${baseUrl}/api/users/9999`, { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});
