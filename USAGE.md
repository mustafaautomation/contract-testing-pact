# Real-World Use Cases

## 1. Microservices Integration — Order Service + User Service

Your Order Service depends on User Service. Instead of spinning up both services for testing:

```typescript
// Consumer test (Order Service)
await provider
  .addInteraction()
  .given('user with ID 1 exists')
  .uponReceiving('a request for user details')
  .withRequest('GET', '/api/users/1')
  .willRespondWith(200, (builder) => {
    builder.jsonBody({
      id: integer(1),
      name: string('Alice'),
      email: string('alice@example.com'),
    });
  })
  .executeTest(async (mockServer) => {
    const client = new UserApiClient(mockServer.url);
    const user = await client.getUserById(1);
    expect(user.name).toBeTruthy();
  });
```

**Result**: Order Service tests run without User Service running. Pact file guarantees compatibility.

## 2. Provider Verification in CI

```yaml
# In User Service CI pipeline
- name: Verify consumer contracts
  run: npm run test:provider
  # Uses pact files from consumer repos
```

If User Service changes break the contract → CI fails before merge.

## 3. Multi-Consumer Contracts

When multiple services consume User Service:
- Order Service expects `{ id, name, email }`
- Notification Service expects `{ id, email, preferences }`

Each consumer generates its own pact file. Provider verifies ALL of them.

## 4. Pact Broker for Team Collaboration

```bash
# Start local broker
npm run broker:up

# Publish consumer pacts
npm run pact:publish

# View contract matrix
open http://localhost:9292
```
