# QA helpers

Run from the repository root against a separately served compiled build. All browser profiles are disposable; helpers do not use your regular browser profile.

| Tool | Use |
|---|---|
| `count-tasks.mjs` | Unique A/B/H checkbox counts, including duplicate detection. Report historical B183 exclusions explicitly. |
| `edit-anchored.mjs` | Exact single-match replacement with preserved line endings. |
| `run-step.mjs <url> <step> [fuzzFile] [port]` | AST-based replay of the fuzz setup, **all prerequisite steps**, and the selected complete step with its assertions. It prints the prerequisite list. |
| `chrome.mjs` | Shared Chrome/Edge discovery (`DNDSHEET_CHROME_PATH`, then `CHROME_PATH`, then installed candidates) and owned temporary-profile cleanup. |
| `browser-probe.mjs` | Bounded CDP connection, app readiness, evaluation errors, runtime exception collection and cleanup for the release probes. |
| `overflow-probe.js` / `npm run audit:fit` | Five widths (640…1920) × two effective CSS viewport/raster scales. Reports clipped overflow, explicit scrolling and intentional Quasar field-label/focus-helper exemptions. |
| `shots.mjs` | Sheet screenshots for four template/style/theme combinations. |

## Step replay

Step replay does not extract a nested template with a delimiter regex or unescape it manually. Acorn preserves JavaScript statement boundaries; the original helpers evaluate interpolation and escapes exactly once. A failed prerequisite, failed assertion or browser exception fails the command. The default timeout is10 minutes; override with `DNDSHEET_RUN_STEP_TIMEOUT_MS`. A late step can take as long as the suite prefix: this command prioritizes reproducibility over pretending a stateful step is isolated.

The selected fuzz file is executable repository code. Do not point the runner at untrusted downloaded scripts. A custom fixture that intentionally needs a different harness must provide it as reviewed code.

## Matrix and fit

`npm run test:e2e:matrix` loads the same five schema/migration fixtures used by core tests. It measures the AC header and value foreground against their nearest painted backgrounds across twelve themes. It fails on missing render/contrast and writes `.gate/release-matrix.json` (`DNDSHEET_MATRIX_ARTIFACT` overrides). This is120 representative samples, not an audit of every color or every text node.

The fit audit writes `.gate/fit.json` (`DNDSHEET_FIT_ARTIFACT` overrides). `DNDSHEET_FIT_CONTROL=1` inserts an intentionally clipped control in the disposable page and must fail. Native browser UI zoom is not automated; effective CSS viewport/raster scaling is recorded precisely. The per-panel full zoom, label and keyboard requirements remain tracked separately. Ellipsis exceptions are listed, not silently discarded.

Set `DNDSHEET_E2E_URL` to the served build. Matrix and fit run sequentially inside the existing named `help` gate step. Do not run heavy builds/tests in parallel with browser fuzzing, and never edit inputs during a gate.

Release tools are `tools/make-rc.mjs` and `tools/publish.mjs`. Review goldens before the final frozen-source gate; generated screenshots remain outside Git.
