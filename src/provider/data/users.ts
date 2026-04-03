import { User } from '../../types';

export const users: User[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin',
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'user',
    createdAt: '2025-02-20T14:30:00.000Z',
  },
  {
    id: 3,
    name: 'Carol Davis',
    email: 'carol@example.com',
    role: 'viewer',
    createdAt: '2025-03-10T09:15:00.000Z',
  },
];

let nextId = 4;

export function getUsers(page = 1, limit = 10): { data: User[]; total: number } {
  const start = (page - 1) * limit;
  return {
    data: users.slice(start, start + limit),
    total: users.length,
  };
}

export function getUserById(id: number): User | undefined {
  return users.find((u) => u.id === id);
}

export function createUser(name: string, email: string, role: User['role']): User {
  const user: User = {
    id: nextId++,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

export function deleteUser(id: number): boolean {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
}
