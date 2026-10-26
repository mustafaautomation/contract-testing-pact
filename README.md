# Contract Testing Pact

[![Contract Tests](https://github.com/mustafaautomation/contract-testing-pact/actions/workflows/contract-tests.yml/badge.svg)](https://github.com/mustafaautomation/contract-testing-pact/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Pact](https://img.shields.io/badge/Pact-Consumer%20Driven-7B4EA4.svg)](https://pact.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

Consumer-driven contract testing framework for microservices using [Pact.io](https://pact.io). Demonstrates how to verify API contracts between services without end-to-end tests.

---

## Why Contract Testing?

| Problem | Contract Testing Solution |
|---------|--------------------------|
| E2E tests are slow and flaky | Contracts verify integration points independently |
| Provider changes break consumers silently | Consumer expectations are codified and verified against the provider |
| Testing requires all services running | Consumer tests use a mock; provider tests run in isolation |
| Hard to test failure scenarios | Contracts define error responses explicitly |

---

## Architecture

```
┌────────────────────┐     contract (pact file)     ┌────────────────────┐
│   Order Service    │ ──────────────────────────── │   User Service     │
│   (Consumer)       │                               │   (Provider)       │
│                    │                               │                    │
│  UserApiClient     │  GET /api/users               │  Express API       │
│  - getUsers()      │  GET /api/users/:id           │  - List users      │
│  - getUserById()   │  POST /api/users              │  - Get user        │
│  - createUser()    │  DELETE /api/users/:id         │  - Create user     │
│  - deleteUser()    │                               │  - Delete user     │
└────────────────────┘                               └────────────────────┘
        │                                                     │
        ▼                                                     ▼
  Consumer Pact Test                                  Provider Verification
  (generates pact file)                              (replays pact against real API)
```

---

## Quick Start

```bash
git clone https://github.com/mustafaautomation/contract-testing-pact.git
cd contract-testing-pact
npm install          # Node.js 22.12+ (CI runs 22 and 24)

# Run unit tests (API client and provider routes)
npm run test:unit

# Run consumer tests (generates pact file)
npm run test:consumer

# Run provider verification (replays pact against real provider)
npm run test:provider

# Run all tests
npm test
```

---

## Test Structure

### Consumer Tests

Consumer tests define what the consumer expects from the provider. They generate a **pact file** (JSON contract).

```
tests/consumer/
└── user-service.consumer.test.ts    # 6 contract interactions
```

Each interaction defines:
- **Provider state** — precondition (e.g., "user with ID 1 exists")
- **Request** — HTTP method, path, headers, body
- **Expected response** — status, headers, body with matchers

### Provider Tests

Provider tests replay the pact file against the real provider API, verifying every interaction.

```
tests/provider/
├── user-service.provider.test.ts       # Verifies all consumer expectations
└── breaking-change.provider.test.ts    # Same pact must fail against a broken provider
```

State handlers set up the required data for each provider state.

The breaking-change test starts a copy of the provider that renames `email` to `emailAddress` in its responses and asserts that verification is rejected. It shows the contract actually catches a breaking change instead of passing whatever the provider returns.

---

## Contract Interactions

| Interaction | Method | Path | Consumer Expects |
|---|---|---|---|
| List users | GET | `/api/users?page=1&limit=10` | Paginated array with id, name, email, role |
| Get user by ID | GET | `/api/users/1` | Single user object |
| User not found | GET | `/api/users/999` | 404 with error message |
| Create user | POST | `/api/users` | 201 with created user |
| Invalid create | POST | `/api/users` | 400 with validation error |
| Delete user | DELETE | `/api/users/2` | 204 no content |

---

## Pact Broker

Optional: Use a Pact Broker to share contracts between teams.

```bash
# Start local broker
npm run broker:up

# Publish pacts
npm run pact:publish

# View broker UI
open http://localhost:9292

# Stop broker
npm run broker:down
```

---

## CI/CD Pipeline

The GitHub Actions workflow runs in two stages:

1. **Consumer** (Node 22 and 24) — lint, format, typecheck, unit tests, then generate the pact file
2. **Provider** — downloads the pact artifact, verifies it against the real provider, and checks that a broken provider is rejected

Pact files are shared between jobs via GitHub Actions artifacts.

---

## Project Structure

```
contract-testing-pact/
├── src/
│   ├── types.ts                     # Shared API types
│   ├── consumer/
│   │   └── api-client.ts            # HTTP client (consumer)
│   └── provider/
│       ├── server.ts                # Express app factory
│       ├── routes/users.ts          # REST endpoints
│       └── data/users.ts            # In-memory data store
├── tests/
│   ├── unit/                        # API client + provider route unit tests
│   ├── consumer/
│   │   └── user-service.consumer.test.ts   # Consumer pact tests
│   └── provider/
│       ├── user-service.provider.test.ts   # Provider verification
│       └── breaking-change.provider.test.ts # Negative verification
├── pacts/                           # Generated pact files (gitignored)
├── scripts/
│   └── publish-pacts.ts             # Pact Broker publish script
├── docker-compose.yml               # Pact Broker (local)
├── Dockerfile                       # Provider service container
└── .github/workflows/
    └── contract-tests.yml           # CI pipeline
```

---

## Commands

| Command | Description |
|---|---|
| `npm test` | Run unit, consumer and provider tests |
| `npm run test:unit` | Unit tests for the API client and provider routes |
| `npm run test:consumer` | Generate pact file from consumer expectations |
| `npm run test:provider` | Verify pact against real provider |
| `npm run start:provider` | Start provider service locally |
| `npm run broker:up` | Start Pact Broker (Docker) |
| `npm run pact:publish` | Publish pacts to broker |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |

---

## Tech stack

Pact JS 17 (PactV4) · TypeScript 6.0 · Vitest 5 · Express 5 · Node.js 24 LTS · ESLint 10 (flat config) · GitHub Actions

## License

MIT

---

Built by [Quvantic](https://quvantic.com)
