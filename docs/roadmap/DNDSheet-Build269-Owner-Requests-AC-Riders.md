# Build 269 — owner requests: AC riders, natural armor, frameless portrait, compact CR/PB row, layer size strip, description containers fix

Base `6e03ebe` (Build 268).

| # | Request | What shipped | Evidence |
|---|---|---|---|
| 1 | **Text Block / Dice Table "not working"** | Root cause: the modern-template **action** projection built its description without `descriptionContainers`, so blocks added in the editor never reached the stat block. Both modern **reaction** branches printed them *before* the description. All projections now append text blocks and dice tables **after** the description. | `description-containers-browser-smoke` (traits, actions, reactions × classic and modern; order asserted). The click path was confirmed with a real CDP mouse click; it was always writing to the store. |
| 2 | **Portrait frame toggle** | `portrait.frameless` and a **No frame** toggle next to the caption. A doubled-id selector removes border, padding, shadow and radius under every theme, with no new `!important`. | Computed style 1px/6px → 0px/0px |
| 3 | **Small numbered fields** | Line 1: CR (10.5rem) · Lair CR (8.5rem) · lair note (fills the rest). Line 2: PB (8rem) · PB scale · nameplate toggles. Challenge data sits together, proficiency data sits together, and the old full-width rows are gone. | CR field measured at 168 px; on phones the nameplate toggles wrap to their own line (caught by the 390 px overflow check, 457 > 390, in `build250-workflow`) |
| 4 | **Natural Armor base** | New base mode **Natural Armor (10 + DEX + bonus)** with its own **Bonus** field. It prints "natural armor" and never adds DEX twice when the ability bonus is also DEX. | `NaturalArmor.test.ts` (2) |
| 5 | **AC riders** | `acConfig.riders[]`. Each rider is **Cadence → Timing → On Hit/On Miss → effect** (the existing preset wording, or custom text), with distance or damage and type fields where the effect needs them. The legacy single On Miss/When Hit pickers and their schedule rows are gone. A legacy pick (from storage, import or the library) migrates into riders automatically, keeping its numbers and schedule, so the printed AC line stays the same. The wording comes from one function (`acTriggerEffectText`) shared with the legacy path. | `AcRiders.test.ts` (legacy pick = migrated rider, byte-equal text; multi-rider composition; empty rider prints nothing); browser smoke: migration + add row |
| 6 | **Layer size in the post-crop radial** | `LayerSizeStrip` sits inside the post-crop radial card (a new default slot) for the portrait and for composition layers. **Linked**: one Scale handle. **Unlinked**: W and H handles show the effective size (scale × axis). Re-linking folds W/H back to a uniform scale at their average. The standalone Uniform Scale blocks and the W/H sliders below them were removed, so no two handles drive the same size. Two `type="number"` inputs went with them. | Browser smoke: the strip is inside `.radial-offset-controller` |

New browser smokes in the shared suite (SPA and Pages): `description-containers`, `build269-features`. Core 701/701 (+5).

## Limits of the evidence

- The size strip's linked/unlinked state is per editor session; the stored model is unchanged.
- Rider wording for preset effects matches the legacy text exactly. Custom text prints as "On Hit: …" / "On Miss: …".
- Structured (composer) traits and actions still place text blocks between the outcomes and the prose. Their order wasn't reported and is left as designed.


**Regressions caught by the gate and fixed:** (1) `basic-riders` expected On Miss/On Hit schedule rows, which now live on the AC rider rows; the test asserts the migrated riders and their cadence/timing instead. (2) Mobile overflow from the nameplate toggles sharing the PB line; they wrap below 600 px.

**Gate:** 11/11, no retries; visual 104/104 identical to production; core 701/701; browser suite 25 scripts.
