# Dusty Strings Rules

## General

- Make the smallest possible change.
- Never refactor unrelated code.
- Never modify files unrelated to the request.
- Explain the implementation plan before editing.
- If uncertain, ask instead of guessing.

## Approval Before Changes

Unless the user explicitly states otherwise:

Do NOT begin editing code immediately.

Instead:

1. Analyze the request.
2. Explain the root cause (for bug fixes) or implementation plan (for new features).
3. List every file you intend to modify.
4. Explain why each file needs changes.
5. Wait for the user's approval before making any edits.

Never assume approval.

If the user says things like:
- "Go ahead"
- "Implement it"
- "Fix it"
- "Proceed"
- "You have approval"

then you may begin editing without asking again.

If the user explicitly says to work autonomously, you may continue without waiting for approval until the task is complete.

## Scope Confirmation

Before making changes, summarize exactly what will be changed.

Do not modify anything outside that scope unless you first ask the user for permission.

## Regression Protection

If a proposed edit changes existing gameplay, game balance, save compatibility, or a working feature that the user did not request, stop and ask for approval before continuing.

## TypeScript

- Never use `any` unless requested.
- Never invent interface properties.
- If an object doesn't match an interface, inspect the interface before changing code.
- Never duplicate properties.
- Build after interface changes.

## Gameplay

- Preserve existing gameplay.
- Do not rebalance mechanics unless requested.
- Reuse existing systems before creating new ones.
- Preserve save compatibility.

## UI

- Match the existing design.
- Reuse components.
- Don't redesign screens unless requested.

## Bug Fixing

- Fix one issue at a time.
- Build after each logical change.
- If new errors appear, stop and explain why.
- Never delete functionality just to satisfy TypeScript.

## Windows

- Use PowerShell commands only.
- Never use Linux commands (`ls`, `grep`, `sed`, `pwd`, etc.).

## Communication

Before editing:
- Explain the plan.
- List files that will change.

After editing:
- Summarize changes.
- Mention any remaining issues.