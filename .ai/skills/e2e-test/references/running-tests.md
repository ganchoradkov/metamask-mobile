# Running & Debugging E2E Tests — Reference

## Prerequisites

The app must be built before running tests. Build once and reuse:

```bash
# iOS debug build
yarn test:e2e:ios:debug:build

# Android debug build
yarn test:e2e:android:debug:build
```

## Run a Specific Spec

```bash
# iOS — run one spec file
IS_TEST='true' NODE_OPTIONS='--experimental-vm-modules' \
  detox test -c ios.sim.main \
  --testPathPattern="tests/regression/predict/predict-buy-flow.spec.ts"

# iOS — run a specific test by name
IS_TEST='true' NODE_OPTIONS='--experimental-vm-modules' \
  detox test -c ios.sim.main \
  --testPathPattern="tests/regression/predict/predict-buy-flow.spec.ts" \
  --testNamePattern="opens market details from market list"

# Android — run one spec file
IS_TEST='true' NODE_OPTIONS='--experimental-vm-modules' \
  detox test -c android.emu.main \
  --testPathPattern="tests/regression/predict/predict-buy-flow.spec.ts"
```

## Run All Tests for a Feature

```bash
IS_TEST='true' NODE_OPTIONS='--experimental-vm-modules' \
  detox test -c ios.sim.main \
  --testPathPattern="tests/regression/predict/"
```

## Lint & Type Check (Run Before Every Test Execution)

```bash
# Lint a specific file
yarn lint tests/regression/predict/predict-buy-flow.spec.ts --fix
yarn lint tests/page-objects/Predict/PredictMarketList.ts --fix

# Lint all new files together
yarn lint tests/regression/predict/ tests/page-objects/Predict/ --fix

# TypeScript check (whole project)
yarn lint:tsc
```

## Common Failures & Fixes

| Failure                       | Cause                                     | Fix                                                                   |
| ----------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `Error: element not found`    | Wrong testID string, element not rendered | Check selector constant, verify `testID` in component                 |
| `Error: element not enabled`  | Button disabled or loading state          | Add `checkEnabled: false` to the `Gestures.tap` call                  |
| `Timeout waiting for element` | Element renders but too slowly            | Add logger; check feature flag mock; increase `timeout` in Assertions |
| `Animation/stability error`   | UI animating when tap is attempted        | Add `checkStability: true` to `Gestures.tap`                          |
| `Unmocked API request`        | Network call not intercepted              | Add the URL to `testSpecificMock`                                     |
| `Feature flag not enabled`    | Feature hidden by flag                    | Add `setupRemoteFeatureFlagsMock` in `testSpecificMock`               |
| `loginToApp timeout`          | Onboarding modal or slow load             | Ensure `restartDevice: true` in `withFixtures`                        |

## Retry for Flaky Interactions

Use `Utilities.executeWithRetry` for inherently unstable taps (carousels, animated modals):

```typescript
import { Utilities } from '../../framework';

async tapButtonWithRetry(): Promise<void> {
  await Utilities.executeWithRetry(
    async () => {
      await Gestures.tap(this.button, { timeout: 2000, description: 'tap button' });
      await Assertions.expectElementToBeVisible(this.nextScreen, {
        timeout: 2000,
        description: 'next screen visible',
      });
    },
    {
      timeout: 30000,
      description: 'tap button and verify navigation',
    },
  );
}
```

## Debugging Tips

1. Add `logger.info(...)` calls in the spec to trace execution progress
2. Check `tests/artifacts/` for screenshots and device logs after a run
3. If the simulator is in an unexpected state: `detox reset-lock-file` then rebuild
4. For animation issues: `await device.disableSynchronization()` before the problematic interaction, `await device.enableSynchronization()` after

## Iteration Loop

```
Fix code → yarn lint --fix → yarn lint:tsc → detox test → read failure → fix → repeat
```

Never skip the lint step after making changes. TypeScript errors caught early save debugging time.
