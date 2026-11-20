# Contributing to Todoist SDK

The following is a set of guidelines for contributing to the Todoist SDK. Please read these guidelines before creating an issue or pull request.

## Open Development

All work on Todoist SDK happens directly on [GitHub](https://github.com/todoist/todoist-sdk-typescript). Both core team members and external contributors send pull requests that go through the same review process.

## Semantic Versioning

Todoist SDK follows [semantic versioning](https://semver.org/). We release patch versions for bugfixes, minor versions for new features or non-essential changes, and major versions for any breaking changes.

Every significant change is documented in the [CHANGELOG.md](CHANGELOG.md) file.

## Branch Organization

Submit all changes to the [main](https://github.com/todoist/todoist-sdk-typescript/tree/main) branch (via PR) by default. For pre-release work, target the `next` branch instead — see [Release Process](#release-process-core-team-only) for details.

We do our best to keep `main` in good shape, with all tests passing.

## Development Workflow

After cloning the repository and installing dependencies with `npm install`, several commands are at your disposal:

- `npm run build`: Builds the package for publishing to npm
- `npm run check`: Validates code quality with oxlint and formatting with oxfmt
- `npm run check:fix`: Auto-fixes lint and formatting issues
- `npm run type-check`: Type-checks the source the build compiles, without writing `dist/`, and the agent tooling in `.agents/scripts/`
- `npm test`: Runs all tests with Vitest
- `npm run test:watch`: Runs tests in watch mode
- `npm run integrity-checks`: Runs the full CI validation pipeline (lint, test, build, type checks)
- `npm run verify`: Runs every check CI runs, in parallel, in about twenty-five seconds; run it before opening a pull request

`npm install` also installs the git hooks, run by [lefthook](https://github.com/evilmartians/lefthook) and configured in `lefthook.yml`: commits and pushes to `main` are refused, `pre-commit` lints and formats the staged files and runs the type check, and `pre-push` runs the tests. [`docs/agents.md`](docs/agents.md) explains them.

## Sending a Pull Request

Before submitting a pull request, please take the following into consideration:

- Create your branch from `main` (or from `next` if working on a pre-release feature)
- Follow the [Commit Message Guidelines](#commit-message-guidelines) below
- Add tests for code that should be tested
- Ensure the test suite passes
- Do not override built-in validation and formatting checks

## Commit Message Guidelines

### Commit Message Format

This repository expects all commit messages to follow the [Conventional Commits Specification](https://www.conventionalcommits.org/) to automate semantic versioning and changelog generation.

Each commit message consists of a **header**, an **optional body**, and an **optional footer**:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Commit types such as `feat:` and `fix:` affect versioning and changelog generation. Other types like `build:`, `chore:`, `ci:`, `docs:`, `perf:`, `refactor:`, `style:` and `test:` are valid but will not trigger a release.

A commit that has the text `BREAKING CHANGE:` at the beginning of its optional body or footer, or appends a `!` after the type/scope, introduces a breaking API change (correlating with `MAJOR` in semantic versioning).

### Semantic Pull Request Validation

PR titles are validated against the Conventional Commits format by CI. When squash-merging, the PR title becomes the commit message, so ensure it follows the format (e.g., `feat: add new endpoint`, `fix: correct pagination`).

## Release Process (core team only)

The release process is fully automated with [semantic-release](https://github.com/semantic-release/semantic-release). Pushing to `main` (after CI passes) triggers a stable release automatically.

### Pre-releases

Use a `next` branch to ship a set of related PRs together, for example several breaking changes that should land in a single major release. Each PR is squash-merged into `next` and published as a pre-release. Then `next` is merged into `main` with a merge commit, so every PR keeps its own changelog entry in the stable release.

1. **Cut `next` from `main`.** Merging `next` into `main` deletes `next` (the repository deletes head branches on merge), so it usually doesn't exist when you start:

    ```sh
    git fetch origin
    git push origin origin/main:refs/heads/next
    ```

    If `next` already exists, sync it with `main` instead. Do this before starting new work, and after each stable release, so semantic-release starts the next pre-release cycle from the latest version:

    ```sh
    git checkout next
    git merge main -m "chore: sync next with main [skip ci]"
    git push origin next
    ```

    > **Important:** Always use `git merge` to sync — never rebase `next` onto `main`. Rebasing rewrites commit hashes, which breaks the git tags that semantic-release uses to track published versions. Since npm does not allow republishing the same version number, a rebase can leave the release pipeline in an unrecoverable state.

2. **Develop on a feature branch** based off `next` and open a PR targeting `next`. To move an existing PR, change its base to `next`.

3. **Squash-merge each PR into `next`.** The PR title becomes the commit message, and later its changelog entry. Each merge triggers CI and publishes a pre-release (e.g., `8.3.0-next.1`) to the `next` dist-tag on npm.

    When PRs depend on each other, merge them bottom-up. Before merging the first one, note the head commit of every PR in the chain, since rebasing changes them:

    ```sh
    gh pr view <PR number> --json headRefOid --jq .headRefOid
    ```

    Squashing gives the merged PR's commits new hashes, so rebase the next PR onto `next` before merging it, dropping the commits up to the noted head of the PR below it:

    ```sh
    git fetch origin
    git rebase --onto origin/next <noted head commit of the PR below> <next PR's branch>
    git push --force-with-lease origin <next PR's branch>
    ```

    Use the noted commit, not the current head of the PR below. Once that PR has been rebased, its head is a new commit that the next PR doesn't contain, and the rebase would replay commits that are already on `next`.

    PRs in a GitHub stack can't be merged with `gh pr merge`. Remove the stack first with `gh stack unstack <stack number>`.

4. **Open a PR from `next` to `main`** once everything on `next` is ready to release. Its description should list the PRs it brings in.

5. **Merge it with a merge commit, from the command line.** Never squash it: a squash collapses every PR into one commit, so the changelog and the version bump come out wrong, and `next`'s commits never become part of `main`'s history. The squash-only rulesets on `main` block merge commits for most people, and the GitHub UI may only offer "Squash and merge". Merge with the GitHub CLI, which uses your ruleset bypass:

    ```sh
    gh pr merge <PR number> --merge --admin --match-head-commit <head commit of next>
    ```

    - `--merge` creates a merge commit. If merge commits aren't allowed, GitHub refuses the merge rather than squashing.
    - `--admin` uses your bypass. It merges straight away, without waiting for pending checks or reviews.
    - `--match-head-commit` refuses the merge if `next` changed since you last checked it.
    - Keep the default title, "Merge pull request #… from todoist/next". It isn't a conventional commit, so it doesn't add an entry of its own to the changelog.

    You need a bypass on the squash-only rulesets to do this. If `gh` reports "Merge commits are not allowed on this repository", ask an org owner.

6. **Check the result.** The merge commit on `main` has two parents, with each PR's commit below it:

    ```sh
    git fetch origin
    git log --graph --oneline -10 origin/main
    ```

    The release workflow then publishes the stable version on the `latest` dist-tag, with one changelog entry per PR. `next` is deleted, and any PRs still open against it are moved to `main`.

[#781](https://github.com/todoist/todoist-sdk-typescript/pull/781) followed these steps: it brought six template PRs into `main` as `24.0.0`.

> **Note:** The `CHANGELOG.md` is only updated for stable releases on `main`. Pre-releases still get GitHub release notes and npm publication.

### Installing a pre-release

```sh
npm install @todoist/sdk@next
```

## License

By contributing to Todoist SDK, you agree that your contributions will be licensed under its [MIT license](LICENSE).
