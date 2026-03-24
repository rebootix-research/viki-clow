---
name: viki-skill-factory
description: Create, refine, and package new VikiClow skills from plain-language task requests. Use when a user asks for a new skill, wants an existing skill improved, or wants VikiClow to teach itself a repeatable workflow.
---

# Viki Skill Factory

Use this skill to turn repeated tasks into first-class VikiClow skills.

## Outcomes

- Create a new skill folder under `skills/`.
- Improve an existing skill without bloating it.
- Add scripts, references, or assets only when they materially improve reliability.

## Workflow

1. Decide whether the request should become a reusable skill instead of a one-off answer.
2. Pick a lowercase hyphenated name that matches the user intent.
3. Write a short frontmatter description that clearly says when the skill should trigger.
4. Keep `SKILL.md` focused on workflow, guardrails, and selection logic.
5. Add `scripts/`, `references/`, or `assets/` only when they reduce repeated work or improve determinism.
6. Reuse local patterns from `skills/skill-creator/SKILL.md` when you need a deeper authoring checklist.

## Quality bar

- Prefer concise instructions over tutorials.
- Make the skill usable by another agent without extra context.
- Avoid adding extra docs like `README.md` or `CHANGELOG.md` inside the skill folder.
- When a skill automates commands, include the safest verification step.

## Packaging rule

If a new skill is added, make sure the final response names it explicitly and explains what it unlocks for VikiClow.
