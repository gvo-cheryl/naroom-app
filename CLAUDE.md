@AGENTS.md

# Naroom App Repository Instructions

## Instruction Structure

Claude Code loads the following repository instructions:

- `CLAUDE.md`: application project and development rules
- `AGENTS.md`: Expo, React Native, and detailed frontend rules
- `.claude/CLAUDE.md`: OMC operating rules
- `docs/PRODUCT_CONTEXT.md`: approved product context when this file exists

This file supplements `AGENTS.md`.
Do not duplicate or weaken the Expo and frontend rules in `AGENTS.md`.

## Project Overview

- Project: `naroom-app`
- Role: Naroom Expo React Native mobile application
- Normal development branch: `dev`
- Stable branch: `main`
- Package manager: `pnpm`

Naroom helps users understand themselves through records, reflection, long-term patterns, and small changes explicitly chosen by the user.

Before changing product behavior or UI structure, review:

1. The user's current instructions
2. The current GitHub Issue or task requirements
3. `AGENTS.md`
4. `docs/PRODUCT_CONTEXT.md` and approved UI/UX documents
5. The current screen structure and implementation
6. The synchronized OpenAPI contract

If sources materially conflict, do not redesign the product silently. Report the conflict and request a decision.

## Current Technical Baseline

- Node.js 24.18.0
- pnpm
- Expo SDK 57
- React Native
- Expo Router
- TypeScript
- Project runtime version management with mise

Use the actual `package.json`, `pnpm-lock.yaml`, Expo configuration, TypeScript configuration, and existing code as the source of truth.

Use `pnpm` only. Do not switch to npm or Yarn.

Do not add or upgrade dependencies, Expo plugins, native modules, build services, or analytics tools that are unrelated to the current task.

## Important Paths

Use the current repository structure as the source of truth.

Common important paths include:

- Routes and screens: `app/`
- Shared UI components: `components/`
- Hooks: `hooks/`
- Shared constants and design resources: `constants/`
- Static assets: `assets/`
- Product context: `docs/PRODUCT_CONTEXT.md`
- OpenAPI snapshot: `openapi/naroom-openapi.yaml`
- Generated API types: the existing generated-type path defined by project scripts
- Expo configuration: `app.json`, `app.config.*`, or the current equivalent
- Package scripts and dependencies: `package.json`

If an existing path already serves the same role, do not create a parallel structure.

## Local Development

Install dependencies:

```bash
pnpm install
```

Start Expo:

```bash
pnpm start
```

Use targets defined by existing package scripts:

```bash
pnpm ios
pnpm web
```

Do not assume a script exists. Inspect `package.json` first.

## Verification

Use scripts that actually exist in `package.json`.

Default verification commands:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm exec expo-doctor
```

If a test environment exists, run focused tests for the changed behavior.

After changing code:

1. Verify the changed component, Route, Hook, or API Adapter directly.
2. Run lint.
3. Run the TypeScript type check.
4. Run Expo Doctor.
5. Run relevant tests when tests exist.
6. Run the relevant platform when runtime verification is required.
7. Review the final diff.
8. Report changed files, commands, results, and any behavior not verified.

Do not report the task as complete when required verification has failed.

## Scope Management

Before editing:

1. Read the current Issue or user request.
2. Read `AGENTS.md` and relevant product and UI documents.
3. Inspect the existing implementation before proposing structural changes.
4. Separate included scope from excluded scope.
5. Briefly state expected file changes and the verification plan.

When the request is clear and within scope, do not wait for an additional approval.

Stop and ask for clarification when:

- Screens, Routes, API contracts, or product documents materially conflict.
- Native configuration outside the requested scope is required.
- Authentication or privacy policy is undecided.
- A required API contract is not approved.
- Existing Navigation or state structure must be substantially redesigned.
- Secrets, signing information, or external account permissions are required.

Do not perform unrelated refactoring, renaming, cleanup, dependency upgrades, or redesign.

## UI and Product Structure Rules

Use the existing prototype and current implementation as the primary baseline for UI improvements.

Unless explicitly requested:

- Do not rebuild the prototype from scratch.
- Do not rewrite the entire screen structure.
- Do not change screen IDs in bulk.
- Do not rename existing functions or state objects without need.
- Do not delete screens.
- Do not restructure Navigation.
- Do not replace the existing flow with a new IA.
- Do not introduce a new design system that conflicts with the current product direction.

When documents and the prototype differ, list the differences first and apply only the approved minimum changes.

Current product rules:

- Keep the existing record action in bottom Navigation.
- Structure it so a later change to a global floating record button does not require a full rewrite.
- Manage shared colors, fonts, spacing, sizes, copy, and reusable data centrally.
- Support the approved light and dark themes.
- Avoid generic illustrations of people, yoga, or meditation.
- Emotion and energy intensity may use internal values from 0 to 100, but do not display them as numbers that evaluate the user.
- Use approved Korean user-facing copy.
- When an approved alternative exists, do not expose the internal term `AI` directly in user-facing copy.
- If alternative copy is undecided, do not invent it silently.
- Use `작은 실험` in user-facing Korean copy.
- Avoid comparison, rankings, streak pressure, failure language, and forced positivity.
- Allow users to agree with, edit, or defer an interpretation.
- Include loading, empty, error, and permission states where needed.
- Prioritize one clear primary action per screen.

## Component and TypeScript Rules

- Follow the Expo Router rules in `AGENTS.md`.
- Use TypeScript for application code.
- Prefer explicit types over `any`.
- Do not suppress type errors without explaining why.
- Keep screen components focused on presentation and user interaction.
- Separate API access, data transformation, state handling, and reusable UI.
- Reuse existing components before creating duplicates.
- Manage shared tokens, copy, configuration, and constants centrally.
- Do not prematurely abstract a one-off structure.
- Isolate and clearly label platform-specific code.
- Preserve accessibility labels, touch target sizes, contrast, text sizing, keyboard behavior, and Safe Area handling.
- Do not change Route names or Navigation behavior for implementation convenience.

## API Contract Rules

The application consumes the public API contract, not backend persistence models.

- Do not infer DTOs from JPA Entities or database tables.
- Do not manually duplicate types that can already be generated from OpenAPI.
- Never manually edit generated API types.
- Regenerate types through the approved package script.
- Do not alter the OpenAPI snapshot merely to make application code compile.
- Report contract problems to the backend contract owner.
- Use stable machine-readable API error codes.
- Distinguish required, optional, and nullable fields.
- Provide a safe fallback for unknown Enum values when needed.
- Handle dates and times according to the approved ISO 8601 and timezone contract.
- Do not assume the backend and application deploy simultaneously.
- Preserve compatibility with supported backend contracts and application versions.

Planned synchronization flow:

```text
Generate OpenAPI in naroom-api
→ Approved OpenAPI snapshot
→ Synchronize snapshot to naroom-app
→ Generate TypeScript types
→ API Adapter
→ Screen and state integration
```

Do not begin application API implementation by guessing request or response fields.

## Record and AI Processing Behavior

- Save the user's original record before and independently of AI processing.
- Never delete or overwrite a saved record because AI processing failed.
- Clearly distinguish record-save state from later reflection-processing state.
- Present later-processing failure as a recoverable error state.
- Do not present generated interpretations as definitive facts or diagnoses.
- Do not expose sensitive record text unnecessarily on the home screen, widgets, notifications, or previews.

## Authentication Rules

- Beta 1 social login scope is Kakao, Google, and Apple login (confirmed 2026-08-12; see naroom-api `docs/instruction/0812_Naroom_Beta1_P1_Complementary_Plan.md`). Google and Apple were reinstated after being deferred out of an earlier version of this document, not a new scope expansion.
- Do not implement account merging across two already-separate members, or general login-method linking beyond adding Google/Apple, without a separate request.
- Kakao/Google/Apple authentication is used to pass verified external identity to the backend.
- Naroom API sessions use Naroom-issued Access Tokens and Refresh Tokens.
- Do not use Kakao tokens as Naroom application session tokens.
- Store Naroom credentials only in an approved secure store.
- Do not store Refresh Tokens in AsyncStorage or another unencrypted general-purpose store.
- Never log authorization codes, tokens, secrets, complete Authorization headers, or Kakao responses containing sensitive values.
- Follow the approved backend contract for refresh, rotation, logout, expiration, and revocation.
- Prevent unlimited token refresh or retry loops.
- Do not automatically restore a pending-deletion account.
- Show the approved deletion-cancellation confirmation flow before restoring account access.

## Environment Variables and Secrets

Expo client code and `EXPO_PUBLIC_*` values may be visible to users and must never contain secrets.

Never place real secrets in:

- Source code
- Test fixtures
- Logs
- `EXPO_PUBLIC_*` environment variables
- `.env.example`
- Git-tracked application configuration
- Documentation
- OpenAPI snapshots
- Git commits
- Claude or OMC output

Claude Code must not read, modify, or print:

- `.env.local`
- `.env.*.local`
- Kakao Client Secrets
- Backend secrets
- OpenAI API keys
- Service account JSON
- Signing certificates
- Private keys
- Keystores
- Provisioning Profiles
- Real Access Tokens or Refresh Tokens
- Real user records

If a secret is found in code or a Git diff, do not repeat its value. Report only the affected file and the potential exposure.

## Protected and Caution Files

Do not modify the following without an explicit request:

- `node_modules/`
- `.expo/`
- `.env.local`
- `.env.*.local`
- Native signing files
- Certificates and keystores
- Generated API types by manual editing
- OpenAPI snapshots by manual editing
- `pnpm-lock.yaml` when dependencies did not change
- Generated `ios/` and `android/` native projects
- Expo application identifiers
- Bundle ID and Package Name
- EAS project and build configuration
- Secret exclusion rules in `.gitignore`

When an approved dependency change modifies the lockfile, use `pnpm` and manage the changed lockfile together.

If a native or Expo configuration change is required, explain the runtime and build impact before editing it.

## OMC and Repository Boundaries

- Follow `.claude/CLAUDE.md` for OMC operating rules.
- Do not use OMC runtime state as authoritative product information.
- Store long-lived decisions in approved project documents.
- Do not modify `naroom-api` during application-only work.
- Do not independently change an approved API contract.
- Do not assign unresolved duplicate screen, state, or contract decisions to parallel Workers.
- Parallelize only when ownership and task boundaries are clear.
- If a contract problem appears during application implementation, stop and report it before changing the snapshot or generated types.

## Git Rules

- `dev` is the normal development and verification branch.
- `main` is the stable branch.
- Do not create a `feature/*` branch without an explicit request.
- Pull Requests are optional and used only for requested large or high-risk changes.
- Do not commit, push, merge, rebase, create a PR, close an Issue, or change remotes without explicit instruction.
- Keep UI, API integration, generated types, configuration, documentation, and AI-tool changes logically separated when practical.
- Never commit local environment files, OMC runtime state, personal settings, secrets, signing files, or user data.
- Do not include references to Claude, AI, or automated tooling in the commit message or body.
- Do not add a "Generated with Claude Code" signature.
- Do not add a `Co-Authored-By: Claude` trailer.
- Write commit messages concisely from the developer's perspective, describing the actual purpose of the change.
- Keep each commit scoped to a single logical change.
- Before committing, show the changed files and the proposed commit message to the user and get approval.

## Working Procedure

1. Read `AGENTS.md`.
2. Review relevant product and UI context.
3. Read the current Issue or user requirements.
4. Inspect existing screens, components, Routes, state, and API structure.
5. Define included and excluded scope.
6. State expected file changes and the verification plan.
7. Implement only the approved scope.
8. Run lint, type checking, Expo Doctor, relevant tests, and runtime verification.
9. Review the final diff and check for secrets.
10. Report changes, commands, results, risks, and unresolved decisions.
