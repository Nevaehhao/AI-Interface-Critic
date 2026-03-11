# Contributing

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Run validation before opening a PR:

```bash
npm run typecheck
npm test
npm run lint
```

## Branch workflow

Keep changes small and feature-sized.

Recommended flow:

1. Create a branch from `main`
2. Implement one coherent feature or fix
3. Run tests and typecheck
4. Commit with a specific message
5. Merge back after verification

## What kinds of contributions are useful

- New AI provider adapters
- Better prompt and schema design for UI/UX critique
- Better report rendering and screenshot annotation UX
- Builder integrations such as GitHub, CLI, or code-agent bridges
- Storage, auth, and deployment improvements
- Test coverage and fixture quality
- Documentation for self-hosting and BYO model setups

## Ground rules

- Preserve mock fallback behavior for local development
- Keep schema changes backward compatible when possible
- Prefer shared contracts over provider-specific UI hacks
- Be explicit about failure states in the UI
- Do not hide whether output came from a live model or fallback

## Pull request checklist

- The change is scoped and named clearly
- Tests were added or updated when behavior changed
- Typecheck passes
- The README or docs were updated if setup or workflows changed
- The UI copy stays honest about what is implemented today
