import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserApiClient } from '../../src/consumer/api-client';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers(),
    statusText: 'OK',
    redirected: false,
    type: 'basic',
    url: '',
    clone: () => ({}) as Response,
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob([])),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(''),
    bytes: () => Promise.resolve(new Uint8Array()),
  } as Response;
}

describe('UserApiClient.getUsers', () => {
  it('should call correct URL with pagination', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(200, { data: [{ id: 1, name: 'Alice' }], total: 1, page: 2, limit: 5 }),
    );

    const client = new UserApiClient('https://api.example.com');
    const result = await client.getUsers(2, 5);

    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/api/users?page=2&limit=5');
    expect(result.data).toHaveLength(1);
    expect(result.page).toBe(2);
  });

  it('should use defaults when no params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { data: [], total: 0, page: 1, limit: 10 }));

    const client = new UserApiClient('http://localhost:3000');
    await client.getUsers();

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/users?page=1&limit=10');
  });

  it('should throw on error response', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(500, { error: 'Internal Server Error', status: 500 }),
    );

    const client = new UserApiClient('http://localhost:3000');
    await expect(client.getUsers()).rejects.toThrow('Internal Server Error');
  });
});

describe('UserApiClient.getUserById', () => {
  it('should fetch user by ID', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        id: 42,
        name: 'Bob',
        email: 'bob@test.com',
        role: 'user',
        createdAt: '2025-01-01',
      }),
    );

    const client = new UserApiClient('http://localhost:3000');
    const user = await client.getUserById(42);

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/users/42');
    expect(user.id).toBe(42);
    expect(user.name).toBe('Bob');
  });

  it('should throw on 404', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(404, { error: 'User not found', status: 404 }));

    const client = new UserApiClient('http://localhost:3000');
    await expect(client.getUserById(999)).rejects.toThrow('User not found');
  });
});

describe('UserApiClient.createUser', () => {
  it('should POST new user', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(201, {
        id: 10,
        name: 'Charlie',
        email: 'charlie@test.com',
        role: 'admin',
        createdAt: '2025-06-01',
      }),
    );

    const client = new UserApiClient('http://localhost:3000');
    const user = await client.createUser({
      name: 'Charlie',
      email: 'charlie@test.com',
      role: 'admin',
    });

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/users');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({
      name: 'Charlie',
      email: 'charlie@test.com',
      role: 'admin',
    });
    expect(user.id).toBe(10);
  });

  it('should throw on 400', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(400, { error: 'name, email, and role are required', status: 400 }),
    );

    const client = new UserApiClient('http://localhost:3000');
    await expect(client.createUser({ name: 'only' } as never)).rejects.toThrow('required');
  });
});

describe('UserApiClient.deleteUser', () => {
  it('should DELETE user by ID', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(204, null));

    const client = new UserApiClient('http://localhost:3000');
    await expect(client.deleteUser(5)).resolves.toBeUndefined();

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/users/5');
    expect(opts.method).toBe('DELETE');
  });

  it('should throw on 404 delete', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(404, { error: 'User not found', status: 404 }));

    const client = new UserApiClient('http://localhost:3000');
    await expect(client.deleteUser(999)).rejects.toThrow('User not found');
  });
});
