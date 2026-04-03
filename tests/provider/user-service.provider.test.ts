import { describe, it, beforeAll, afterAll } from 'vitest';
import { Verifier } from '@pact-foundation/pact';
import path from 'path';
import http from 'http';
import { createApp } from '../../src/provider/server';

describe('User Service Provider Verification', () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 3001;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('validates the expectations of the OrderService consumer', async () => {
    const verifier = new Verifier({
      providerBaseUrl: `http://localhost:${port}`,
      pactUrls: [
        path.resolve(process.cwd(), 'pacts', 'OrderService-UserService.json'),
      ],
      stateHandlers: {
        'users exist': async () => {
          // Default seed data is already loaded
        },
        'user with ID 1 exists': async () => {
          // User 1 exists in seed data
        },
        'user with ID 2 exists': async () => {
          // User 2 exists in seed data
        },
        'user with ID 999 does not exist': async () => {
          // No user with ID 999 in seed data
        },
        'the user service is available': async () => {
          // Server is running, no special setup needed
        },
      },
    });

    await verifier.verifyProvider();
  });
});
