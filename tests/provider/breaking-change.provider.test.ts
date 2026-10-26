import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Verifier } from '@pact-foundation/pact';
import express from 'express';
import path from 'path';
import http from 'http';
import userRoutes from '../../src/provider/routes/users';

/**
 * Negative check: the same pact must FAIL verification against a provider
 * that ships a breaking change. Here the provider renames `email` to
 * `emailAddress` in every JSON response, which the OrderService consumer
 * depends on. If this test ever passes verification, the contract is not
 * protecting the consumer.
 */
function renameField(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(renameField);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      out[key === 'email' ? 'emailAddress' : key] = renameField(v);
    }
    return out;
  }
  return value;
}

function createBrokenApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use((_req, res, next) => {
    const original = res.json.bind(res);
    res.json = (body: unknown) => original(renameField(body));
    next();
  });
  app.use('/api', userRoutes);
  return app;
}

describe('Provider with a breaking change', () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = createBrokenApp().listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('fails verification when a field the consumer uses is renamed', async () => {
    const verifier = new Verifier({
      providerBaseUrl: `http://localhost:${port}`,
      pactUrls: [path.resolve(process.cwd(), 'pacts', 'OrderService-UserService.json')],
      logLevel: 'error',
      stateHandlers: {
        'users exist': async () => {},
        'user with ID 1 exists': async () => {},
        'user with ID 2 exists': async () => {},
        'user with ID 999 does not exist': async () => {},
        'the user service is available': async () => {},
      },
    });

    await expect(verifier.verifyProvider()).rejects.toThrow();
  });
});
