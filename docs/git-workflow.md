# Git Workflow

## Rule

Every feature is developed on its own branch, then committed, pushed, and merged back into `main`.

## Branch naming

Use short, readable names:

- `feature/project-scaffold`
- `feature/landing-page`
- `feature/upload-flow`
- `feature/loading-state`
- `feature/report-ui`
- `feature/analyze-api`
- `feature/openai-integration`
- `feature/supabase-storage`

## Standard flow

### 1. Sync `main`

```bash
git checkout main
git pull origin main
```

### 2. Create a feature branch

```bash
git checkout -b feature/<feature-name>
```

### 3. Implement the feature

During the feature:

- keep scope small
- run local checks before commit
- do not mix unrelated work into the same branch

### 4. Commit

Use direct commit messages:

```bash
git add .
git commit -m "Add <feature summary>"
```

Examples:

- `Add project scaffold`
- `Add landing page hero and CTA`
- `Add upload flow with file validation`

### 5. Push branch

```bash
git push -u origin feature/<feature-name>
```

### 6. Merge back into `main`

If you are merging locally:

```bash
git checkout main
git pull origin main
git merge --no-ff feature/<feature-name> -m "Merge feature/<feature-name>"
git push origin main
```

### 7. Delete merged branch

```bash
git branch -d feature/<feature-name>
git push origin --delete feature/<feature-name>
```

## Recommended feature cadence

Build the app in this branch order:

1. `feature/project-scaffold`
2. `feature/landing-page`
3. `feature/upload-flow`
4. `feature/loading-state`
5. `feature/report-ui`
6. `feature/analyze-api`
7. `feature/openai-integration`
8. `feature/supabase-storage`

## Quality gate before merge

Before merging a feature branch:

- app runs locally
- lint passes
- types pass
- feature scope matches the branch name
- README or docs are updated if behavior changed

## Working agreement for this repo

For this project, I will follow this process whenever I implement a new feature:

1. Create a new branch from `main`
2. Build only that feature
3. Commit with a clear message
4. Push the branch to `origin`
5. Merge it back into `main`
6. Push the updated `main`
