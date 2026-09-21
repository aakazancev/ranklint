# Contributing

## Setup

```bash
pnpm install
pnpm dev:prepare
```

## Gate

Run the same checks CI runs before opening a PR:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm publint
node scripts/generate-config-schema.mjs --check
node scripts/bundle-guard.mjs
```

## Changesets

Every change that is visible to users of a published package needs a changeset:

```bash
pnpm changeset
```

Pick `minor` for a new feature or new public API, `patch` for a fix. All packages share one version (`fixed` group in `.changeset/config.json`), so bumping one bumps them all; internal dependencies are updated with `updateInternalDependencies: patch`.

## Release

`.github/workflows/release.yml` runs on every push to `main`:

1. It installs, builds and runs the full gate (lint, typecheck, test, build, publint).
2. While unreleased changeset files exist, `changesets/action` keeps a pull request named `chore: release` open. That PR contains the version bumps, the updated `CHANGELOG.md` files and the removal of the consumed changesets.
3. Merging the `chore: release` PR triggers the workflow again; with no changesets left, the action runs `pnpm changeset publish`, which publishes the packages to npm and pushes git tags.

The workflow needs a repository secret `NPM_TOKEN` with publish rights for `ranklint` and `@ranklint/*`.
