# QA helpers

Read-only tools for agents working on this repository. Run them from the repository root.

| Tool | Use |
|---|---|
| `count-tasks.mjs` | Count Backlog checkboxes per loop (A, B, H) and list duplicate ids — the workload numbers in every report. |
| `edit-anchored.mjs` | Replace one exact block in a file, keeping its line endings; refuses unless the anchor matches once. Never patch code through PowerShell double-quoted strings (they expand `${…}`). |
| `run-step.mjs` | Run one fuzz step's page code against a served bundle and print the real result or exception. |
| `shots.mjs` | Screenshot the sheet for four template/style/theme combinations from a fixture. |

The RC and publish scripts live one level up: `tools/make-rc.mjs`, `tools/publish.mjs`.
