# Copilot Customizations

This folder contains workspace-scoped Copilot customizations for Rayn Motoparts POS. These files help keep work consistent across backend, frontend, tests, and docs.

## What Is Included

- copilot-instructions.md: Always-on project guidance.
- instructions/*.instructions.md: File-specific rules by area (backend, frontend, docs, tests).
- agents/*.agent.md: Specialized agents for backend, frontend, qa, and docs.
- skills/*/SKILL.md: On-demand workflows for common tasks.

## How To Use

- Instructions: Apply automatically when you edit matching files.
- Agents: Open the agent picker or type @backend, @frontend, @qa, or @docs in chat.
- Skills: Type / in chat and select the skill (feature-implementation, backend-api, frontend-module, test-plan, docs-plan).

## Add Or Update

- For new areas, add a new instructions file under instructions/ with a clear description and applyTo pattern.
- For new workflows, add a skill under skills/<name>/SKILL.md.
- For specialized roles, add an agent under agents/.

## Notes

- Keep descriptions keyword-rich so Copilot can discover the right tool.
- Avoid over-broad applyTo patterns; keep them scoped to relevant folders.
- Keep docs concise and task-focused.
