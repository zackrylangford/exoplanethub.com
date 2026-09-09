# Scout Report — exoplanethub.com
> Last updated: 2026-09-09

Dependency and ecosystem intelligence for this repo. Findings are web-verified; every entry
cites the source consulted and the date it was checked. Scout does not write application code —
this file is its only output.

## Current Stack

### Frontend — `exoplanethub.com/`

| Package | Current | Latest | Type | Docs |
|---------|---------|--------|------|------|
| next | 16.3.3 | 16.3.4 | framework | [nextjs.org/docs](https://nextjs.org/docs) |
| react | 19.2.8 | 19.2.8 | framework | [react.dev](https://react.dev/) |
| react-dom | 19.2.8 | 19.2.8 | framework | [react.dev](https://react.dev/reference/react-dom) |
| @aws-sdk/client-dynamodb | 3.1124.0 | 3.1128.0 | data | [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-dynamodb/) |
| @aws-sdk/lib-dynamodb | 3.1124.0 | 3.1128.0 | data | [lib-dynamodb](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/) |
| server-only | 0.0.1 | 0.0.1 | infra | [npm](https://www.npmjs.com/package/server-only) |
| typescript | 5.9.3 | 7.0.2 | tooling | [typescriptlang.org](https://www.typescriptlang.org/docs/) |
| eslint | 9.39.5 | 10.10.0 | tooling | [eslint.org](https://eslint.org/docs/latest/) |
| eslint-config-next | 16.3.3 | 16.3.4 | tooling | [Next.js ESLint](https://nextjs.org/docs/app/api-reference/config/eslint) |
| vitest | 4.1.11 | 5.0.0 | test | [vitest.dev](https://vitest.dev/) |
| jsdom | 30.0.1 | 30.0.1 | test | [npm](https://www.npmjs.com/package/jsdom) |
| @vitejs/plugin-react | 6.1.1 | 6.1.1 | test | [npm](https://www.npmjs.com/package/@vitejs/plugin-react) |
| @testing-library/react | 16.3.3 | 16.3.3 | test | [testing-library.com](https://testing-library.com/docs/react-testing-library/intro/) |
| @testing-library/jest-dom | 7.0.1 | 7.0.1 | test | [npm](https://www.npmjs.com/package/@testing-library/jest-dom) |
| @testing-library/user-event | 14.6.7 | 14.6.7 | test | [npm](https://www.npmjs.com/package/@testing-library/user-event) |
| @types/node | 25.9.5 | 26.5.0 | types | [DefinitelyTyped](https://www.npmjs.com/package/@types/node) |
| @types/react | 19.2.18 | 19.2.18 | types | [DefinitelyTyped](https://www.npmjs.com/package/@types/react) |
| @types/react-dom | 19.2.5 | 19.2.7 | types | [DefinitelyTyped](https://www.npmjs.com/package/@types/react-dom) |

### Backend — `aws-backend/`

| Package | Current | Latest | Type | Docs |
|---------|---------|--------|------|------|
| Lambda runtime | `python3.13` | `python3.15` (preview) | infra | [Lambda runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html) |
| boto3 | *unpinned* | 1.43.90 | data | [boto3 docs](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html) |
| pytest | `>=8,<9` (deliberate) | 9.1.1 | test | [docs.pytest.org](https://docs.pytest.org/) |

The Lambda's only third-party runtime import is `boto3`; the NASA archive fetch uses stdlib
`urllib`. There is no `requests`, no HTTP client dependency and no vendored packages — the backend
supply chain is one package deep.

### CI/CD — `.github/workflows/`

All four workflows are on current majors as of #86 (merged 2026-09-03). Every pinned action now
runs on a `node24` runtime.

| Action | ci.yml | backend-ci.yml | deploy-aws-backend.yml | codeql.yml | Latest |
|--------|--------|----------------|------------------------|------------|--------|
| actions/checkout | v7 | v7 | v7 | v7 | v7.0.1 |
| actions/setup-python | — | v7 | v7 | — | v7.0.0 |
| actions/setup-node | v7 | — | — | — | v7.0.0 |
| pnpm/action-setup | v6 | — | — | — | v6.0.10 |
| aws-actions/setup-sam | — | — | v3 | — | v3 |
| aws-actions/configure-aws-credentials | — | — | v6 | — | v6.2.4 |
| github/codeql-action | — | — | — | v4 | v4 |

Workflow permissions are least-privilege and correct: `contents: read` on both CI workflows,
`security-events: write` scoped to CodeQL, and `id-token: write` only on `deploy-aws-backend.yml`.

## Tool Output

<details>
<summary>pnpm outdated (raw output from 2026-09-09)</summary>

```
$ pnpm outdated
┌──────────────────────────┬──────────┬──────────┐
│ Package                  │ Current  │ Latest   │
├──────────────────────────┼──────────┼──────────┤
│ @types/react-dom (dev)   │ 19.2.5   │ 19.2.7   │
├──────────────────────────┼──────────┼──────────┤
│ eslint-config-next (dev) │ 16.3.3   │ 16.3.4   │
├──────────────────────────┼──────────┼──────────┤
│ next                     │ 16.3.3   │ 16.3.4   │
├──────────────────────────┼──────────┼──────────┤
│ @aws-sdk/client-dynamodb │ 3.1124.0 │ 3.1128.0 │
├──────────────────────────┼──────────┼──────────┤
│ @aws-sdk/lib-dynamodb    │ 3.1124.0 │ 3.1128.0 │
├──────────────────────────┼──────────┼──────────┤
│ @types/node (dev)        │ 25.9.5   │ 26.5.0   │
├──────────────────────────┼──────────┼──────────┤
│ eslint (dev)             │ 9.39.5   │ 10.10.0  │
├──────────────────────────┼──────────┼──────────┤
│ typescript (dev)         │ 5.9.3    │ 7.0.2    │
├──────────────────────────┼──────────┼──────────┤
│ vitest (dev)             │ 4.1.11   │ 5.0.0    │
└──────────────────────────┴──────────┴──────────┘
```

</details>

<details>
<summary>pnpm audit (raw output from 2026-09-09)</summary>

```
$ pnpm audit
No known vulnerabilities found

$ pnpm audit --prod
No known vulnerabilities found
```

Both trees are clean. This is the state after #78 refreshed the lockfile on 2026-09-02, which
cleared all 28 advisories the previous report recorded. Verified in the lockfile on `dev`:
`browserslist` 4.28.8, `@babel/core` 7.29.7, `@humanfs/node` 0.16.8 — all at or above their
patched versions. The production tree is 123 packages.

</details>

## 🔴 Urgent

**None.** The previous run's Urgent finding — 28 advisories clearing with a lockfile refresh, 3 of
them in the production tree — landed as #78 on 2026-09-02 and is confirmed resolved above. It has
been removed rather than archived.

## 🟡 Recommended

### Vitest 5.0.0 is a clean drop-in here — I ran the full suite to prove it
- **Package**: vitest 4.1.11 → 5.0.0 (dev only)
- **Why**: Vitest 5.0.0 was published **2026-09-03**. On paper this major looked risky for this
  repo, because the release notes list *"`toHaveTextContent` is strict, add `toMatchTextContent` as
  alternative"* — and this suite calls `toHaveTextContent` **85 times, 17 of those with a regex**,
  which the migration guide says the new matcher *"no longer accepts"*. Two other behaviour flips
  looked live too: `clearMocks` now defaults to `true`, and unawaited async assertions now fail the
  test.
- **Verified empirically this run**: copied the frontend to a scratch directory outside the repo,
  ran `pnpm add -D vitest@5`, and ran the suite. **All 757 tests across 44 files passed, unchanged.**
  `pnpm typecheck` also passed clean, and `pnpm audit` on the resulting tree stayed at zero.

  | | vitest 4.1.11 | vitest 5.0.0 |
  |---|---|---|
  | Test files | 44 passed | 44 passed |
  | Tests | 757 passed | 757 passed |
  | `tsc --noEmit` | clean | clean |

  **Why the matcher change is a non-issue here**, since this is the part worth trusting: the
  `toHaveTextContent` this suite uses is not Vitest's. `vitest.setup.ts` imports
  `@testing-library/jest-dom/vitest`, whose `dist/vitest.js` runs
  `vitest.expect.extend(matchers.extensions)` — jest-dom's permissive substring/regex matcher is
  registered *over* Vitest's built-in, so it wins. The other flips are genuinely inert: no file uses
  the removed `sequential` option, and the 22 files using `vi.mock`/`vi.fn` do not depend on mock
  call history surviving across tests.
- **Prerequisites already met**: Vitest 5 requires Node >= 22.12.0 and Vite >= 6.4.0. CI runs
  `node-version: 22` (which resolves to current 22.x) and the lockfile already resolves
  `vite@8.2.2`. `@types/node` 25.9.5 satisfies the new `^22 || >=24` peer.
- **Source**: [Vitest 5.0.0 release](https://github.com/vitest-dev/vitest/releases/tag/v5.0.0) ·
  [Vitest migration guide](https://vitest.dev/guide/migration) ·
  [npm registry publish times](https://registry.npmjs.org/vitest) | **Verified**: 2026-09-09
- **Search terms used**: `curl https://registry.npmjs.org/vitest` for dist-tags, publish times,
  peer deps and engines; "Vitest 5 migration guide breaking changes";
  `grep -rn 'toHaveTextContent'` and `grep -rn 'toHaveTextContent(/'` across the suite
- **Breaking changes** (none of which bite this repo): `sequential` removed in favour of
  `concurrent`; `clearMocks` defaults to `true`; unawaited `resolves`/`rejects` now fail;
  `attachmentsDir` moved to `.vitest/attachments/`; config is no longer looked up in ancestor
  directories; the `webdriverio` package was removed; `@vitest/runner` and `expect` are now inlined.
- **Action**: A one-line `package.json` bump plus lockfile. Worth taking — it is the only major in
  the stack that is actually reachable right now, and unlike ESLint 10 and TypeScript 7 nothing
  upstream is blocking it. CI (`lint`, `typecheck`, `test`, `build`) is the check, and the scratch
  run above says it will be green.

### ESLint 9 is EOL and v10 is still blocked — one package, and it has not moved
- **Package**: eslint 9.39.5 (final 9.x) → 10.10.0 blocked
- **Why**: ESLint 9 passed end-of-life on **2026-08-06**. Every 9.x tarball on npm — all 58 of them
  — carries the deprecation string *"This version is no longer supported. Please see
  https://eslint.org/version-support for other options."* `latest` is now **10.10.0** (published
  2026-09-04); the `maintenance` dist-tag still points at 9.39.5, which is the last 9.x that will
  ever ship. No further security patches will be issued for the 9.x line.
- **Still blocked by exactly one package**: `eslint-config-next` depends on
  `eslint-plugin-react ^7.37.0`, whose latest release **7.37.5 is still dated 2025-04-03** — no
  publish in ~17 months, and *no version it has ever published* declares an `eslint` peer above
  `^9.7`. Under ESLint 10 it hard-crashes on the removed `context.getFilename()`.
- **Correction to the previous report**: it implied `typescript-eslint` was part of this block. It
  is not. `typescript-eslint@8.69.0` (the pinned version) and 8.70.0 both declare
  `peerDependencies.eslint: "^8.57.0 || ^9.0.0 || ^10.0.0"` — verified on the registry this run.
  `eslint-plugin-react` is the whole blocker.
- **Upstream state, re-checked this run — no movement**:
  - [jsx-eslint/eslint-plugin-react#3977](https://github.com/jsx-eslint/eslint-plugin-react/issues/3977)
    still **open** (47 comments, last activity 2026-08-29). The last maintainer comment was
    **2026-05-20**; everything since is from non-members.
  - Two fix PRs exist and both sit **unmerged awaiting maintainer review**:
    [#3979](https://github.com/jsx-eslint/eslint-plugin-react/pull/3979) (updated 2026-08-22) and
    [#4022](https://github.com/jsx-eslint/eslint-plugin-react/pull/4022) "complete ESLint 10
    compatibility" (26 commits, updated 2026-09-02).
  - [vercel/next.js#91710](https://github.com/vercel/next.js/pull/91710) — note this is a **PR, not
    an issue**, as the previous report called it — is still open against `canary` and has been
    **stale since 2026-07-27**. Vercel's own tracking issue is
    [#89764](https://github.com/vercel/next.js/issues/89764); a Vercel maintainer confirmed there on
    2026-07-29 that they are waiting on the `eslint-plugin-react` PR to land.
  - `eslint-config-next@16.3.4` and even `16.4.0-canary.22` still depend on
    `eslint-plugin-react ^7.37.0`. **No Next.js release has shipped ESLint 10 support.**
- **Source**: [eslint.org/version-support](https://eslint.org/version-support/) ·
  [registry.npmjs.org/eslint](https://registry.npmjs.org/eslint) ·
  [registry.npmjs.org/eslint-plugin-react](https://registry.npmjs.org/eslint-plugin-react) ·
  [next.js#89764](https://github.com/vercel/next.js/issues/89764) | **Verified**: 2026-09-09
- **Search terms used**: `curl https://registry.npmjs.org/<pkg>` for dist-tags, deprecation flags
  and peer ranges across `eslint`, `eslint-plugin-react`, `typescript-eslint`, `eslint-config-next`;
  `gh api` on the four upstream issues/PRs for state and last-activity dates
- **Action**: Nothing to do — and specifically **do not** try `eslint@10`; the lint job will crash,
  not warn. Staying on 9.39.5 is correct. Scout re-checks the two plugin PRs each run and will raise
  this to Urgent if a CVE lands in the 9.x tree with no patched transitive. If this is still stuck by
  the time it genuinely bothers you, the escape hatch is migrating to
  `@eslint-react/eslint-plugin` and sourcing React Compiler rules from `eslint-plugin-react-hooks` —
  a real migration, worth costing only then.

### The deploy workflow holds AWS credentials and pins its actions to mutable tags
- **Package**: `.github/workflows/deploy-aws-backend.yml`
- **Why**: This is the only workflow with `id-token: write`; it assumes an AWS role via OIDC and
  runs `sam deploy`. It calls two **third-party** actions — `aws-actions/setup-sam@v3` and
  `aws-actions/configure-aws-credentials@v6` — pinned to floating major tags. A major tag is a
  moving pointer by design: the maintainer re-points it on every patch release, so it is mutable
  regardless of GitHub's immutable-releases feature. GitHub's own hardening guide is explicit:
  *"Pinning an action to a full-length commit SHA is currently the only way to use an action as an
  immutable release"*, because *"a tag can be moved or deleted if a bad actor gains access to the
  repository storing the action"*. It also notes that *"a compromise of a single action within a
  workflow can be very significant, as that compromised action would have access to all secrets
  configured on your repository"*.
- **Scope, honestly stated**: this is hardening, not an active vulnerability. There is no advisory
  against either action, and `aws-actions` is an AWS-owned org, so the likelihood is low. The reason
  it is worth doing anyway is blast radius rather than likelihood — this workflow can assume a role
  in Zack's AWS account, which is the highest-value thing in the repo. The `actions/*` pins are
  GitHub-owned and a tier lower risk; the two `aws-actions/*` ones are the ones that matter.
- **Source**: [GitHub — Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) ·
  [Immutable releases are now GA](https://github.blog/changelog/2025-10-28-immutable-releases-are-now-generally-available/)
  | **Verified**: 2026-09-09
- **Search terms used**: "GitHub Actions security hardening pin action commit SHA";
  "GitHub Actions immutable releases general availability 2026 tag mutability"
- **Action**: Pin just the two `aws-actions/*` uses in `deploy-aws-backend.yml` to full-length
  commit SHAs with the version in a trailing comment (`uses: aws-actions/setup-sam@<sha> # v3`),
  which is the documented convention and keeps Dependabot able to bump them. Scoping it to the one
  privileged workflow keeps the change to two lines and avoids churning the three unprivileged ones.
  Related and worth folding in: the `setup-sam` step passes `use-installer: true` with no `version:`
  input, so every deploy installs whatever SAM CLI is newest at that moment — the same unpinned-tool
  exposure as the `boto3` finding below, in the workflow that holds the credentials.

### `boto3` is unpinned in the Lambda requirements — and a default is about to change under it
- **Package**: `aws-backend/lambda/sync/requirements.txt` → `boto3` (no version constraint)
- **Why**: `sam build` resolves `boto3` to whatever is latest at build time — currently **1.43.90,
  published 2026-09-08**. The same tag deployed twice can ship different dependency code, and
  nothing in the repo records what was installed.
- **New this run — a concrete reason, not just a principle**: boto3 **1.43.3** (2026-05-04)
  introduced the `AWS_NEW_RETRIES_2026` opt-in, which changes the default retry mode to `standard`
  and adds **service-specific max attempts for DynamoDB**, revised retry quota costs and new backoff
  scale factors. The changelog states the flag *"is temporary and will be removed in a future
  release when the updated behavior becomes the default."* No flip date has been announced. When it
  flips, an unpinned `boto3` in this sync Lambda silently picks up new DynamoDB retry counts and
  backoff timing with no code change and no diff to review. That is the argument for a bound.
- **No advisories**: OSV and the GitHub Advisory DB both return empty for `boto3` and `botocore`,
  checked this run. One transitive worth knowing about — `urllib3` before 2.6.3 carries
  [GHSA-38jv-5279-wg99](https://osv.dev/vulnerability/GHSA-38jv-5279-wg99) (high, decompression-bomb
  bypass on redirects) — but botocore 1.43.90 asks for `urllib3>=1.25.4,<3,!=2.2.0`, so a fresh
  build resolves the patched 2.7.0. It would only bite from a stale build cache.
  This all contrasts with `requirements-dev.txt`, which *is* deliberately pinned with a comment
  giving exactly this reasoning — the runtime dependency deserves what the test one already has.
- **Source**: [boto3 on PyPI](https://pypi.org/pypi/boto3/json) ·
  [boto3 CHANGELOG](https://raw.githubusercontent.com/boto/boto3/develop/CHANGELOG.rst) ·
  [Lambda runtimes — included SDKs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)
  | **Verified**: 2026-09-09
- **Search terms used**: PyPI JSON API for `boto3`/`botocore` version + upload time; OSV `query` and
  `gh api /advisories?ecosystem=pip` for both; boto3 changelog for breaking changes since 1.43.0
- **Action**: Zack's call on the shape. A compatible-release bound (`boto3~=1.43`) matching the
  existing pytest-pin convention is the low-friction option; dropping the line entirely and relying
  on the SDK the `python3.13` runtime already bundles is the other. Either is better than unbounded,
  and the retry-default change makes the choice worth making before it lands rather than after.

### Routine version drift — Next.js, AWS SDK and two type packages
- **Package**: next + eslint-config-next 16.3.3 → 16.3.4, @aws-sdk/* 3.1124.0 → 3.1128.0,
  @types/react-dom 19.2.5 → 19.2.7
- **Why**: All routine, no security content.
  - **Next.js 16.3.4** (2026-08-31) is unchanged since the last report and is still `latest` — no
    16.3.5. It re-enables AVIF Image Optimization plus three backported bug fixes.
  - **AWS SDK** is four releases / seven days behind (3.1128.0 published 2026-09-08). All four are
    routine service-model regeneration — EC2, MediaTailor, AppFlow, SageMaker, Step Functions docs.
    Nothing DynamoDB-related. The only v3 advisory on record,
    [GHSA-6475-r3vj-m8vf](https://github.com/advisories/GHSA-6475-r3vj-m8vf) (low, 2026-01-08), was
    fixed in 3.723.0 — roughly 400 releases back — and its own text says it *"does not address a
    security vulnerability."*
- **Worth recording — the two Next.js criticals are now formally published**:
  [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36) (CVE-2026-75604, Windows
  RCE) and [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) (CVSS 9.5, AVIF
  Image Optimization RCE) hit the GitHub Advisory Database on **2026-09-08**, having previously only
  been visible in the 16.3.3 release notes. I pulled their ranges: both are `>= 16.0.0, < 16.3.3`,
  **patched in 16.3.3**. The pin is the fix, which is why `pnpm audit` stays clean now that the
  advisories are in the feed. Exposure is nil independently: `next/image` is imported **nowhere** in
  the repo (re-checked on `dev` this run, zero hits) and `next.config.ts` declares no `images` key,
  so the Image Optimization API is unreachable — and the Windows advisory is moot on Vercel.
- **Source**: [registry.npmjs.org/next](https://registry.npmjs.org/next) ·
  [Next.js v16.3.4 release](https://github.com/vercel/next.js/releases/tag/v16.3.4) ·
  [aws-sdk-js-v3 releases](https://github.com/aws/aws-sdk-js-v3/releases) | **Verified**: 2026-09-09
- **Search terms used**: `curl https://registry.npmjs.org/next` for dist-tags and publish times;
  `gh api /advisories?ecosystem=npm&affects=next` and `gh api /advisories/<ghsa>` for ranges;
  `git grep next/image` on `dev` for the exposure re-check
- **Action**: Low priority — fold into the next routine bump rather than doing it for its own sake.
  `next` and `eslint-config-next` are exact-pinned so they need a manifest edit and must move
  together; the AWS SDK and `@types/react-dom` move with a lockfile refresh. Natural companion to
  the Vitest 5 bump above if you want one dependency PR instead of two.

## 🟢 Awareness

### TypeScript 7 now has a real unblock date: 7.1 stable, targeted 2026-11-24
- **What**: The situation is unchanged — TS 7.0.2 is `latest`, and `typescript-eslint@8.70.0` still
  declares `peerDependencies.typescript: ">=4.8.4 <6.1.0"`, so adopting TS 7 today breaks `pnpm
  lint`. The root cause is that **TS 7.0 ships no programmatic compiler API**; the 7.0 announcement
  says outright *"TypeScript 7.0 does not ship with an API. We expect TypeScript 7.1 to ship with a
  new (and different) API."*
- **New this run — the date**: Microsoft's [TypeScript 7.1 Iteration
  Plan](https://github.com/microsoft/TypeScript/issues/63703) (open, updated 2026-09-05) publishes a
  schedule, and **"Stabilize API"** is the first Language and Compiler bullet on it:

  | Milestone | Date |
  |---|---|
  | 7.1 Beta | 2026-10-06 |
  | 7.1 RC | 2026-11-10 |
  | **7.1 Stable** | **2026-11-24** |

  So the gate on TS 7 for this project is roughly late November, plus however long typescript-eslint
  then needs for a major that consumes the new API — tracked in
  [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940),
  which is open with no timeline. typescript-eslint has meanwhile shipped a warning when TS 7 is
  detected and an `onUnsupportedTypeScriptVersion` option, so it is clearly expecting people to try.
- **Source**: [TypeScript 7.1 Iteration Plan](https://github.com/microsoft/TypeScript/issues/63703) ·
  [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) ·
  [registry.npmjs.org/typescript-eslint](https://registry.npmjs.org/typescript-eslint)
  | **Verified**: 2026-09-09
- **Search terms used**: `gh api repos/microsoft/TypeScript/issues/63703` for the milestone table;
  `curl https://registry.npmjs.org/typescript-eslint` for the peer range on 8.69.0 and 8.70.0
- **Impact**: No action now — staying on 5.9.3 remains correct. The value of this entry is that the
  wait is now bounded rather than open-ended. ESLint 10 and TypeScript 7 are still best planned as
  one tooling refresh; this puts the earliest realistic window at end of 2026, and the
  `eslint-plugin-react` blocker is the one more likely to be the long pole.

### A Vitest advisory published yesterday — already patched here, no action
- **What**: [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) /
  CVE-2026-84373, **medium**, published **2026-09-08**: path traversal / arbitrary file read via a
  `@vitest/mocker` redirect mock. `@vitest/mocker` registers a redirect target without validating it
  against the dev server's file-serving allowlist, so an attacker who can reach the dev server's
  WebSocket can read local files.
- **Why this repo is fine**: the affected range is `>= 2.1.0, < 4.1.11` and the project is on
  **exactly 4.1.11**, the patched version — verified in the lockfile on `dev`. It has been on 4.1.11
  since before #78, so this is timing luck rather than something the lockfile refresh earned. The
  Vitest 5.0.0 recommended above is also patched (the 5.x fix landed in 5.0.0-rc.2). Exposure would
  have been limited anyway: the advisory notes the unauthenticated path is through the public
  `mockerPlugin`/`interceptorPlugin` exports used by *third-party* dev servers, while Vitest's own
  browser mode uses token-authenticated RPC — and this project only ever runs `vitest run`.
- **Source**: [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)
  | **Verified**: 2026-09-09
- **Search terms used**: `gh api /advisories?ecosystem=npm&affects=vitest` swept across the stack
  (`vitest`, `vite`, `esbuild`, `jsdom`, `react`, `react-dom`, `@aws-sdk/client-dynamodb`,
  `styled-jsx`) for anything published in the last 60 days
- **Impact**: None. Recorded because it is the kind of finding a clean `pnpm audit` can hide — the
  advisory is real and current, the project simply happens to sit one patch above it.

### The `pytest>=8,<9` pin is now costing something — the escape hatch closed
- **What**: This pin is deliberate and annotated in the file, and I am not re-flagging it as work.
  But there is a genuine new development worth recording, which is the only reason a deliberate
  decision gets revisited. **pytest 8.x is now effectively unmaintained**: the last 8.x release is
  **8.4.2, 2025-09-04** — over a year ago, with no 8.4.3 on PyPI and the `8.4.x` branch quiet since
  2025-11-03. Meanwhile the migration to 9 got *harder*, not easier: pytest 9.0 turned
  `PytestRemovedIn9Warning` into an error by default but documented an opt-out
  (`filterwarnings = ignore::pytest.PytestRemovedIn9Warning`), and the changelog states the affected
  features *"will be effectively removed in pytest 9.1"* — which shipped 2026-06-13. The stopgap no
  longer exists.
- **Source**: [pytest on PyPI](https://pypi.org/pypi/pytest/json) ·
  [pytest changelog](https://raw.githubusercontent.com/pytest-dev/pytest/main/doc/en/changelog.rst)
  | **Verified**: 2026-09-09
- **Search terms used**: PyPI JSON API for the full 8.4.x/9.x release history and upload times;
  pytest changelog for the 9.0 and 9.1 breaking-change entries
- **Impact**: Low and not urgent — the test suite is small, runs only in CI, and nothing is broken.
  The honest read is that the pin has flipped from prudent to mild debt: it now buys no safety (8.x
  gets no fixes) and the cost of crossing it grows slowly. Worth a look the next time the backend is
  open anyway, not worth a dedicated PR. Zack's call; recorded, not re-flagged.

### `datetime.utcnow()` in the sync Lambda — deprecated, but the frontend already compensates
- **What**: `aws-backend/lambda/sync/app.py:26` builds its sync timestamp with
  `datetime.utcnow().isoformat()`, producing a **naive** ISO string with no `Z`/`+00:00` offset.
  `utcnow()` has warned since Python 3.12. Checked this run: it is listed under *"Pending removal in
  future versions"* — **not** under 3.14, 3.15 or 3.16 — so there is still no removal date, and
  nothing has changed since the last report.
- **Correction to an assumption worth stating**: the obvious follow-on worry is that a naive stamp
  gets parsed as *local* time by JS `new Date()` and silently shifts by the reader's UTC offset.
  I checked, and that bug does **not** exist here — `lib/syncDate.ts` already has a `parseUtc` shim
  that appends `Z` when no offset is present, with a comment naming this exact hazard. So the data
  renders correctly today; the naive stamp is a latent trap the frontend has already defused, not a
  live defect.
- **Source**: [Python deprecations index](https://docs.python.org/3/deprecations/index.html) ·
  [datetime docs](https://docs.python.org/3/library/datetime.html) | **Verified**: 2026-09-09
- **Search terms used**: "Python datetime.utcnow removal version 3.14 3.15 scheduled";
  read `lib/syncDate.ts` and `app.py` on `dev` to check the actual consumer
- **Impact**: Low, and lower than it first looks. If it is ever touched, `datetime.now(timezone.utc)`
  is the one-line fix and would let the `parseUtc` shim be simplified — but the shim also protects
  against a corrupt stamp, so this is a tidy-up, not a bug fix. Flagging only; Scout does not write
  application code.

### CI/CD posture: the action bumps landed two weeks before a hard deadline
- **What**: Three things about the workflow surface, all currently healthy.
  1. **A deadline the project just cleared.** GitHub is removing Node 20 from the runners on
     **2026-09-23** — 14 days out — and the `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION` opt-out dies
     with it. `aws-actions/setup-sam@v2` runs on `node20`; `@v3` (2026-05-01) moved to `node24`.
     #86 took this repo to `@v3` on 2026-09-03, so the tag-triggered deploy workflow is safe. Had
     that PR not landed, `sam deploy` would have broken on 2026-09-23. Every action in all four
     workflows is now on a node24 major.
  2. **`sam validate` will change upstream** — SAM CLI 1.166.1's only change was pinning `cfn-lint`
     below the release that drops SAM transform support. This repo runs only `sam build` and
     `sam deploy`, so it is outside the blast radius. Recorded so it is not a surprise later.
  3. **An Actions lockfile is coming.** GitHub's 2026 Actions security roadmap describes a
     workflow-level `dependencies:` block for deterministic action resolution — public preview
     quoted at 3–6 months from March 2026, GA at ~6 months, so plausibly this year. Adoption is
     voluntary; GitHub is explicitly *not* mandating SHA-pinning. If it ships, it is the tidier
     long-term answer to the pinning finding above.
- **Source**: [Deprecation of Node 20 on GitHub Actions runners](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/) ·
  [GitHub Actions 2026 security roadmap](https://github.blog/news-insights/product-news/whats-coming-to-our-github-actions-2026-security-roadmap/) ·
  [aws-actions/setup-sam](https://github.com/aws-actions/setup-sam) | **Verified**: 2026-09-09
- **Search terms used**: "GitHub Actions Node 20 deprecation runner removal date";
  `action.yml` at the v1/v2/v3 tags of `setup-sam` to confirm the `runs.using` runtime per major
- **Impact**: None outstanding — this is a "the last PR was well-timed" note plus two things to
  expect. No action.

### `@types/node` 26 is ahead of the Node 22 the project actually runs on
- **What**: `pnpm outdated` reports `@types/node` 25.9.5 → 26.5.0. The major tracks the Node 26 API
  surface, but CI pins `node-version: 22` and Vercel builds on a Node 22 baseline. Taking the major
  would let code typecheck against APIs the runtime does not have.
- **Source**: [registry.npmjs.org/@types/node](https://registry.npmjs.org/@types/node)
  | **Verified**: 2026-09-09
- **Search terms used**: `curl https://registry.npmjs.org/@types/node` for `dist-tags.latest`
- **Impact**: Deliberate lag is correct. Keep `@types/node` on the major matching the CI Node
  version; revisit only when CI moves to Node 24 or 26. Note Vitest 5 would also be happy on 22.

### Supply chain: install-script surface — zero in production, one in dev, and pnpm is blocking it
- **What**: Install-time hooks (`preinstall`/`install`/`postinstall`) are the single most common npm
  supply-chain attack vector, so I scanned for them directly rather than trusting the audit tools.
  **All 123 production packages have zero install-time hooks** — verified this run by reading every
  installed `package.json` in the prod tree. That is an unusually clean result and worth locking in.
- **The dev tree has exactly one**: `unrs-resolver@1.12.2` → `postinstall: node postinstall.js`,
  reaching the tree via `eslint-config-next → eslint-import-resolver-typescript`. It is currently
  **blocked** — `pnpm install` prints *"Ignored build scripts: unrs-resolver"*, because pnpm 10 does
  not run lifecycle scripts unless a package is allowlisted in `onlyBuiltDependencies`. Lint
  resolution works fine without the native build.
- **Why that one is worth naming**: `unrs-resolver` and its sibling `napi-postinstall` (also in this
  tree, at 0.3.4) share a maintainer, and `napi-postinstall@0.3.1` **was trojanized** —
  [MAL-2025-6025](https://osv.dev/vulnerability/MAL-2025-6025), 2025-07-21, part of the
  `eslint-config-prettier` maintainer-phishing wave
  ([GHSA-f29h-pxvx-f335](https://github.com/advisories/GHSA-f29h-pxvx-f335)). That was a stolen
  credential, not a bad actor, and it was remediated. I confirmed both installed versions are clean
  against OSV (`napi-postinstall@0.3.4` → no match, `unrs-resolver@1.12.2` → no match). The point is
  only that the tree's one install hook sits on the branch with a compromise in its history.
- **Source**: [MAL-2025-6025](https://osv.dev/vulnerability/MAL-2025-6025) ·
  [pnpm — `onlyBuiltDependencies`](https://pnpm.io/settings#onlybuiltdependencies)
  | **Verified**: 2026-09-09
- **Search terms used**: scripted read of every `package.json` in `pnpm ls --prod --depth Infinity`
  for the three hook names; OSV `query` for `napi-postinstall` and `unrs-resolver` at the installed
  versions; `pnpm why unrs-resolver` for provenance
- **Impact**: Nothing is wrong today — the protection is already on by pnpm's default. Two small
  things follow. First, **do not run `pnpm approve-builds` on reflex** to silence that warning; if a
  future dependency genuinely needs a build step, allowlist that one package. Second, the cheap
  hardening is to make the default explicit by adding `"onlyBuiltDependencies": []` to
  `package.json` — it costs one line, documents the intent, and means a future dependency that wants
  to run code at install time has to be added deliberately rather than inherited quietly.
### Supply chain: the tree is clean but has no margin — and one prod pin cannot be moved
- **What**: `pnpm audit` reporting zero is true, but it is a snapshot, so I swept the whole installed
  tree — **123 production and 546 total unique `name@version` pairs** — against OSV and the GitHub
  Advisory Database directly. Both agree with pnpm: **zero exploitable advisories, prod and dev.**
  The interesting result is not a missed CVE — it is *how little headroom* there is. Six packages
  sit on **exactly** the patched version, and **five of those advisories were published yesterday**:

  | Installed | Advisory | Sev | Patched at | Advisory published |
  |---|---|---|---|---|
  | next@16.3.3 | GHSA-2xp9-vwfh-vxw4 | critical | 16.3.3 | 2026-09-08 |
  | next@16.3.3 | GHSA-p293-qw3h-jr36 | critical | 16.3.3 | 2026-09-08 |
  | sharp@0.35.4 | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) (libheif) | high | 0.35.4 | 2026-09-08 |
  | js-yaml@4.3.2 | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | high | 4.3.2 | 2026-09-08 |
  | vitest@4.1.11 | GHSA-82fw-gwwq-j7x9 | medium | 4.1.11 | 2026-09-08 |
  | postcss@8.5.23 | [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) | medium | 8.5.23 | 2026-08-03 |

  Being exactly on the patch is not a vulnerability — patched is patched. It does mean a clean audit
  today says less about tomorrow than it looks like it does.
- **The one structural item worth acting on eventually — `postcss`**: `next@16.3.3` declares
  `"postcss": "8.5.23"` as an **exact pin, no caret**, so it cannot be moved by a lockfile refresh.
  I checked whether the routine Next bump fixes this: **it does not — `next@16.3.4` pins the very
  same 8.5.23.** Meanwhile postcss `latest` is 8.5.28 (2026-09-03), five releases ahead. What makes
  this worth recording rather than ignoring is the fix history: the same `sourceMappingURL` path
  traversal has now been patched **three times**, each because the previous fix was incomplete —
  GHSA-6g55-p6wh-862q (2026-07-23), GHSA-r28c-9q8g-f849 (2026-07-24), then GHSA-fxqj-rqcc-2cmp
  (2026-08-03), whose title is literally *"incomplete fix of GHSA-6g55-p6wh-862q"*. If a fourth
  lands, this project is pinned to a vulnerable postcss with no lever short of a Next.js release.
  The dev tree separately carries postcss 8.5.26 via `@vitejs/plugin-react`, so the **production**
  copy is the older of the two.
- **Exposure, stated honestly**: near zero today. The postcss issue needs attacker-controlled CSS
  with `from` unset; this project runs postcss at build time over its own stylesheets, and there is
  no user-supplied CSS anywhere. This is a "know where the pin is" note, not a live risk.
- **Source**: [OSV API](https://api.osv.dev/) ·
  [registry.npmjs.org/next/16.3.4](https://registry.npmjs.org/next/16.3.4) ·
  [registry.npmjs.org/postcss](https://registry.npmjs.org/postcss) | **Verified**: 2026-09-09
- **Search terms used**: OSV `querybatch` over the flattened tree (123 prod, 546 total unique
  `name@version`, counted from `pnpm ls --depth Infinity --json`); `gh api /advisories?ecosystem=npm&affects=<pkg>` for each; `curl
  registry.npmjs.org/next/16.3.3` and `/16.3.4` to compare the pinned dependency blocks
- **Impact**: No action required now. If the Next bump in the Recommended section gets taken, note
  it moves `sharp` from `^0.35.3` to `^0.35.4` — raising the floor above the libheif advisory — but
  leaves postcss exactly where it is. Scout will re-check the postcss chain each run and raise a
  finding if a fourth advisory lands while the pin is unmovable.

### Supply chain: an active npm worm hit three packages in this dev tree — all at safe versions
- **What**: The **ChainDrop / Shai-Hulud** campaign compromised the npm account behind the `keyv`
  and `cacheable` namespaces on **2026-08-04**. It is notable for defeating build provenance:
  attackers pushed to the source repo and cut releases through GitHub Actions, so poisoned versions
  reached npm **with valid signed attestations**. The payload was a `preinstall` hook that downloaded
  a standalone Bun runtime and harvested AWS, GCP, Azure, GitHub and npm credentials, then
  self-propagated. Singapore's CSA still listed it as active as of this week.
- **Three of the affected packages are in this project's dev tree** — and all three are safe:

  | Installed | Compromised version | Status |
  |---|---|---|
  | `keyv@4.5.4` | 6.0.0 | **not affected** |
  | `flat-cache@4.0.1` | 6.1.24 | **not affected** |
  | `file-entry-cache@8.0.0` | 11.1.6 | **not affected** |

  All three arrive via `eslint@9.39.5 → file-entry-cache ^8.0.0 → flat-cache ^4.0.0 → keyv ^4.5.4`.
  **The protection is a major-version gap, not timing luck** — even a fully unlocked `pnpm install`
  cannot float from the 8.x/4.x/4.x lines into the 11.x/6.x ones. I confirmed each installed version
  independently against OSV: `keyv@4.5.4`, `flat-cache@4.0.1` and `file-entry-cache@8.0.0` all
  return no match, while [MAL-2026-11524](https://osv.dev/vulnerability/MAL-2026-11524) confirms
  `keyv@6.0.0` as malicious, published 2026-08-04.
- **Reassuring detail about the ESLint 10 upgrade**: the obvious worry is that moving to ESLint 10
  crosses onto the affected major lines. It does — `eslint@10.10.0` depends on `file-entry-cache`
  — but upstream has already handled it. The declared range is
  **`11.1.5 || >11.1.6 <12`**, which explicitly excludes the poisoned 11.1.6. Corroborating that,
  the registry `latest` tags have been rolled back below the bad releases: `keyv` 5.6.0,
  `flat-cache` 6.1.23, `file-entry-cache` 11.1.5.
- **Nothing else in the stack was touched**: no compromise of `react`, `react-dom`, `next`,
  `@aws-sdk/*`, `vitest` or `eslint` themselves. A cross-check of all installed `name@version` pairs
  against an aggregated known-malicious corpus returned **zero exact matches**.
- **Source**: [MAL-2026-11524 (OSV)](https://osv.dev/vulnerability/MAL-2026-11524) ·
  [Socket — keyv/cacheable compromise](https://socket.dev/blog/popular-npm-packages-in-the-keyv-and-cacheable-namespaces-compromised-in-active-supply-chain) ·
  [Datadog — npm worm analysis](https://securitylabs.datadoghq.com/articles/npm-worm-compromises-popular-npm-packages/) ·
  [CSA Singapore AD-2026-009](https://www.csa.gov.sg/alerts-and-advisories/advisories/ad-2026-009/)
  | **Verified**: 2026-09-09
- **Search terms used**: "npm supply chain attack August 2026 keyv cacheable compromised"; OSV
  `query` for `keyv`/`flat-cache`/`file-entry-cache` at both the installed and the malicious
  versions; `curl registry.npmjs.org/eslint/10.10.0` to read the declared cache-chain range
- **Impact**: None outstanding — recorded because "we were near this one" is worth knowing, and
  because it is the concrete argument for the `onlyBuiltDependencies` line suggested above: the
  entire attack executed through a `preinstall` hook, which is exactly what pnpm is already blocking.

### Supply chain: single-maintainer packages in the production tree
- **What**: Four production dependencies have exactly **one** npm maintainer account. The previous
  report flagged only `server-only`; this run found three more, and one detail worth pausing on.
  - `server-only@0.0.1` → `sebmarkbage`. Unchanged since **2022-09-03**, single version ever
    published. Baseline holds exactly. Risk remains negligible: the whole package is two files —
    `index.js` is a bare `throw`, `empty.js` is empty, selected via the `react-server` export
    condition. No install script, no runtime logic to subvert, and any tampering would show up in a
    five-line diff. It guards `lib/dynamo.ts` and `lib/latestDiscoveries.ts` from client bundling.
  - **`postcss@8.5.23` and `browserslist@4.28.8` share a single maintainer account (`ai`)** — so one
    compromised account reaches two production dependencies at once. This is the one genuinely new
    concentration in the list.
  - `sharp@0.35.4` → `lovell`. Pulled in as an optional dependency of `next` for image
    optimization; installed and present in the prod tree.
- **Mitigating**: all of these publish through GitHub Actions with provenance attestations. Worth
  noting that provenance attests *build* integrity, not *source* integrity — the ChainDrop attack
  above produced validly-attested malicious packages — so it narrows the window rather than closing
  it.
- **Source**: [registry.npmjs.org](https://registry.npmjs.org/) maintainer metadata per package
  | **Verified**: 2026-09-09
- **Search terms used**: `curl https://registry.npmjs.org/<pkg>` reading `maintainers` and
  `versions[latest]._npmUser` across the production set
- **Impact**: No action — these are all canonical, high-volume, actively-published packages and
  there is no lever to pull. Recorded as the standing concentration risk so it is a known quantity
  rather than a surprise, and so `ai` holding two prod packages is on the record.

### Supply chain: publisher baseline re-checked — two corrections to the previous report
- **What**: Re-ran the maintainer check against the 2026-09-02 baseline. **Nothing changed in the
  reporting window** (2026-09-02 → 2026-09-09) for any critical package. But reconstructing
  ownership over a longer horizon turned up two things the previous report stated too confidently:
  - **`next` did change hands during 2026**, contrary to the previous "no ownership changes" line.
    Per-version maintainer snapshots show `rauchg` and `timneutkens` removed at 16.1.5 (2026-01-26),
    then `matt.straka` added at 16.2.5 and `matheuss` at 16.2.7. **Assessed benign**: `matt.straka`
    maintains hundreds of packages across the whole Vercel estate, consistent with an org release
    engineer, and publishing moved from a human account to GitHub Actions with OIDC trusted
    publishing at the same time — a hardening signal, not a compromise signal. Current set is
    `vercel-release-bot`, `matt.straka`, `matheuss`, `zeit-bot`.
  - **React's repository moved orgs**: the registry now points `react` at
    `github.com/react/react`, not `facebook/react`. Verified legitimate rather than a hijack — the
    GitHub API returns **301 Moved Permanently** from `facebook/react` to the same underlying
    repository ID, i.e. an org rename, consistent with React moving to the React Foundation. npm
    maintainers narrowed to `fb` and `react-bot`, publishing via GitHub Actions.
- **Current publisher set, for future diffing**: `react`/`react-dom` → `fb`, `react-bot`.
  `@aws-sdk/*` → `amzn-oss`, `aws-sdk-bot`. `next` → as above. `eslint` → `openjsfoundation`,
  `eslintbot`. `vitest` → `ariperkkio`, `antfu`, `hiogawa`, `oreanno`, `yyx990803` (healthiest set
  in the stack). `styled-jsx` → `rauchg`, `timneutkens`, `vercel-release-bot`, last published
  2025-04-30 and hard-pinned to 5.1.6 by Next.
- **Typosquatting**: no risk. Every name in `package.json` is the canonical high-volume package.
- **Source**: [registry.npmjs.org](https://registry.npmjs.org/) per-version `maintainers` history ·
  [github.com/react/react](https://github.com/react/react) | **Verified**: 2026-09-09
- **Search terms used**: `curl https://registry.npmjs.org/<pkg>` diffing `maintainers` across the
  version history; `gh api repos/facebook/react` to confirm the redirect target
- **Impact**: None. The corrections matter only because this baseline exists to make a *future*
  change detectable — an inaccurate baseline would have produced a false alarm later.

### Supply chain: `eslint-plugin-react` is still the stale single point of failure
- **What**: Unchanged and confirmed again this run — `latest` is still **7.37.5, published
  2025-04-03**, now 17 months stale, maintained by `ljharb` and `yannickcr`. It reaches this repo
  transitively through `eslint-config-next`, so there is no direct lever here. Full detail is in the
  ESLint finding under Recommended; this entry exists so the supply-chain view is complete.
- **Source**: [registry.npmjs.org/eslint-plugin-react](https://registry.npmjs.org/eslint-plugin-react)
  | **Verified**: 2026-09-09
- **Search terms used**: `curl https://registry.npmjs.org/eslint-plugin-react` for `time.modified`,
  `dist-tags` and the full peer-range history
- **Impact**: Dev-tooling only — it cannot affect the deployed site. The realistic risk is schedule,
  not security: it holds the project on an EOL linter for as long as it stays unpublished.

### Lambda runtime is in good shape, and moving to Python 3.14 would buy nothing
- **What**: `template.yaml` runs `python3.13`, supported until **2029-06-30**. Checked whether
  3.14 is worth moving to: it is GA as a Lambda runtime, but its deprecation date is **the same
  2029-06-30** — that date is the Amazon Linux 2023 EOL, shared by `python3.14`, `java25`, `java21`
  and `provided.al2023`, not a Python-specific date. So the upgrade buys **zero additional runway**.
  `python3.15` exists only in public preview, which AWS documents as not for production.
  CPython 3.13's own upstream EOL is 2029-10, four months after the Lambda cutoff.
- **Source**: [AWS Lambda runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html) ·
  [Python devguide — versions](https://devguide.python.org/versions/) | **Verified**: 2026-09-09
- **Search terms used**: "AWS Lambda python3.14 runtime deprecation date"; Lambda runtimes table for
  the full deprecation schedule; CPython devguide for upstream EOL
- **Impact**: None — no runtime churn warranted. Revisit only when AL2023 successors appear, which
  is years out. The backend remains the healthiest part of the stack.

## 📋 Run Log

| Date | Focus | Findings | Notes |
|------|-------|----------|-------|
| 2026-09-09 | Post-merge re-baseline; Vitest 5 major; lint-chain unblock re-check; full OSV sweep of prod + dev; supply-chain drift | 0 urgent, 5 recommended, 13 awareness | **Urgent cleared** — #78 landed the lockfile refresh and both `pnpm audit` and a 546-package OSV sweep now return zero; finding deleted, not archived. #86 landed every action bump, and that turned out to be timely: `setup-sam@v2` runs on node20 and GitHub removes node20 from runners on 2026-09-23. Headline new finding: **Vitest 5.0.0 is a verified drop-in** — the 85 `toHaveTextContent` call sites looked like a blocker but jest-dom's `expect.extend` overrides Vitest's strict matcher; proved it by running the full suite on a scratch copy, 757/757 pass unchanged. Also new: the deploy workflow pins third-party actions to mutable tags while holding AWS OIDC; `next` hard-pins `postcss` 8.5.23 and **16.3.4 does not move it**, on a CVE chain already patched three times for incomplete fixes; the ChainDrop npm worm hit three packages present in the dev tree, all safe by a major-version gap, and eslint 10 already excludes the poisoned version in its range. Corrected two over-confident claims from last run: `typescript-eslint` never blocked ESLint 10, and `next` *did* change npm ownership during 2026 (benign). TS 7 now has a real unblock date — 7.1 stable targeted 2026-11-24. No injection attempts found in any repository text. |
| 2026-09-02 | First run — full inventory of frontend, backend and CI; supply-chain + transitive deep dive | 1 urgent, 4 recommended, 7 awareness | Established the report. Headline: `pnpm update` alone clears all 28 advisories (3 in the prod tree) with no manifest change — verified by re-auditing a scratch copy; landed as #78. ESLint 9 hit EOL 2026-08-06 and is npm-deprecated, but v10 is blocked upstream by `eslint-plugin-react`. TS 7.0 is stable but unusable until typescript-eslint widens past `<6.1.0`. Cross-checked the 124-package prod tree against OSV — same three advisories, nothing missed. No injection attempts or anomalous publishers found. |
