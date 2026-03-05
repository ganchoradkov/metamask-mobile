# API & Feature Flag Mocking — Reference

## How Mocking Works

All E2E tests run with a proxy mock server. Requests not matched by a mock reach the real network, but the test framework warns you (and will soon enforce this). Always mock external APIs your feature calls.

## testSpecificMock Pattern

Pass to `withFixtures` to apply mocks only for that test:

```typescript
import { Mockttp } from 'mockttp';
import { setupRemoteFeatureFlagsMock } from '../../api-mocking/helpers/remoteFeatureFlagsHelper';
import { setupMockRequest } from '../../api-mocking/mockHelpers';

const testSpecificMock = async (mockServer: Mockttp) => {
  // Feature flags
  await setupRemoteFeatureFlagsMock(mockServer, { myFeatureEnabled: true });

  // GET request
  await setupMockRequest(mockServer, {
    requestMethod: 'GET',
    url: 'https://api.example.com/data',
    response: { items: [] },
    responseCode: 200,
  });
};

await withFixtures({ fixture: ..., testSpecificMock }, async () => { ... });
```

## Feature Flag Mocking

```typescript
import { setupRemoteFeatureFlagsMock } from '../../api-mocking/helpers/remoteFeatureFlagsHelper';

// Simple boolean flags
await setupRemoteFeatureFlagsMock(mockServer, {
  predictTradingEnabled: true,
  carouselBanners: false,
});

// Nested flags
await setupRemoteFeatureFlagsMock(mockServer, {
  bridgeConfig: { support: true, refreshRate: 5000 },
});

// Flask distribution
await setupRemoteFeatureFlagsMock(mockServer, { perpsEnabled: true }, 'flask');

// Combine predefined configs
import { confirmationsRedesignedFeatureFlags } from '../../api-mocking/mock-responses/feature-flags-mocks';
await setupRemoteFeatureFlagsMock(
  mockServer,
  Object.assign({}, ...confirmationsRedesignedFeatureFlags, { myFlag: true }),
);
```

## HTTP Request Mocking

```typescript
import {
  setupMockRequest,
  setupMockPostRequest,
} from '../../api-mocking/mockHelpers';

// GET
await setupMockRequest(mockServer, {
  requestMethod: 'GET',
  url: 'https://api.example.com/resource',
  response: { data: [] },
  responseCode: 200,
});

// POST with body validation
await setupMockPostRequest(
  mockServer,
  'https://api.example.com/submit',
  { amount: '1000000000000000000' }, // expected request body
  { success: true }, // response
  { statusCode: 201, ignoreFields: ['timestamp', 'nonce'] },
);
```

## Shared Mock Response Files

For mocks used across multiple tests, create a file in `tests/api-mocking/mock-responses/`:

```typescript
// tests/api-mocking/mock-responses/predict-mocks.ts
import { MockApiEndpoint } from '../framework/types';

export const PREDICT_MOCKS = {
  GET: [
    {
      urlEndpoint: 'https://predict.api.metamask.io/markets',
      responseCode: 200,
      response: { markets: [{ id: 'btc-usd', name: 'BTC above $100k?' }] },
    },
  ] as MockApiEndpoint[],
};
```

Then pass directly to `withFixtures`:

```typescript
await withFixtures({ fixture: ..., testSpecificMock: PREDICT_MOCKS }, async () => { ... });
```

## Controller-Level Mocking (Advanced)

Only needed when the feature uses SDKs with complex transport (WebSockets, custom protocols) that can't be intercepted at the HTTP level.

- Implement a mixin in `tests/controller-mocking/mock-config/`
- See `tests/docs/CONTROLLER_MOCKING.md` for details
- Prefer HTTP-level mocking whenever possible

## Debugging Unmocked Requests

Check test output for warnings like:

```
⚠️  Unmocked request: GET https://api.example.com/resource
```

Add a mock for every such request to ensure test determinism.
