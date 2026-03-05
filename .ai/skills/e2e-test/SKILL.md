# E2E Test Builder — Skill

> **One source of truth** for adding Detox E2E tests to MetaMask Mobile.
> Applies to: Claude Code (`.claude/commands/e2e-test.md`), Cursor, Copilot, Windsurf, and other AI agents.

## What This Skill Does

Guides you through adding a new E2E regression or smoke test end-to-end:

1. Plans the test (type, location, infrastructure needed)
2. Creates or reuses Page Objects and selectors
3. Writes the spec using the mandatory framework patterns
4. Runs lint and type checks
5. Executes the test locally via Detox
6. Iterates until the test passes

## 10 Golden Rules

1. **Always use `withFixtures`** — every spec must be wrapped; no exceptions
2. **Always use Page Object Model** — no `element(by.id())` in spec files
3. **Always import from `tests/framework/index.ts`** — never from individual files
4. **Always add `description`** to every `Gestures.*` and `Assertions.*` call
5. **Never use `TestHelpers.delay()`** — use `Assertions.*` which has auto-retry
6. **Use `FixtureBuilder` for state** — do not set state through UI interactions
7. **Selectors live in `*.testIds.ts`** (co-located) or `tests/selectors/` (legacy)
8. **Tag correctly** — `SmokeE2E` for smoke, `RegressionTrade` / `RegressionWallet` / etc. for regression
9. **Descriptive test names** — no 'should' prefix (e.g., `'opens market details'`)
10. **Fix lint/tsc before running** — never run with known errors

## Workflow Overview

```
Step 0 → Understand requirement + choose type (smoke/regression)
Step 1 → Discover / create Page Objects and selectors
Step 2 → Write the spec (withFixtures + POM + correct tag)
Step 3 → Lint + TSC (fix all errors)
Step 4 → Run detox test locally
Step 5 → Iterate (fix → lint → run) until green
```

## References

- [Writing Tests](./references/writing-tests.md) — spec structure, templates, FixtureBuilder patterns
- [Page Objects & Selectors](./references/page-objects.md) — POM structure, selector conventions
- [API & Feature Flag Mocking](./references/mocking.md) — testSpecificMock, setupRemoteFeatureFlagsMock
- [Running & Debugging](./references/running-tests.md) — detox commands, common failures, retry patterns

## Quick Commands

```bash
# Run a specific spec (iOS)
IS_TEST='true' NODE_OPTIONS='--experimental-vm-modules' \
  detox test -c ios.sim.main \
  --testPathPattern="tests/regression/<feature>/<spec>.spec.ts"

# Lint the new files
yarn lint tests/regression/<feature>/<spec>.spec.ts --fix
yarn lint:tsc

# Build if app not built yet
yarn test:e2e:ios:debug:build
```
