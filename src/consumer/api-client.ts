import { User, CreateUserRequest, PaginatedResponse, ErrorResponse } from '../types';

export class UserApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getUsers(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const res = await fetch(`${this.baseUrl}/api/users?page=${page}&limit=${limit}`);
    if (!res.ok) {
      const err = (await res.json()) as ErrorResponse;
      throw new Error(err.error);
    }
    return (await res.json()) as PaginatedResponse<User>;
  }

  async getUserById(id: number): Promise<User> {
    const res = await fetch(`${this.baseUrl}/api/users/${id}`);
    if (!res.ok) {
      const err = (await res.json()) as ErrorResponse;
      throw new Error(err.error);
    }
    return (await res.json()) as User;
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const res = await fetch(`${this.baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = (await res.json()) as ErrorResponse;
      throw new Error(err.error);
    }
    return (await res.json()) as User;
  }

  async deleteUser(id: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      const err = (await res.json()) as ErrorResponse;
      throw new Error(err.error);
    }
  }
}
