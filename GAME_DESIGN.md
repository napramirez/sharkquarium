# Sharkquarium — Technical Design

Implementation details for the scaffold: architecture, engine APIs, build pipeline, and
workflow. Game-specific requirements — lore, navigation, entities, scoring, art and
audio direction — live in `FEATURES.md`. Keep both files in sync when either changes.

## 1. Architecture

Layers:

| Path                     | Responsibility                                        |
| ------------------------ | ----------------------------------------------------- |
| `src/engine/`            | Reusable engine: loop, scenes, input, audio, rendering, UI widgets |
| `src/ui/`                | Game-facing UI components (HUD)                       |
| `src/config.js`          | All game tuning, palette, and the storage key         |
| `src/entities/`          | Game entities built on `Entity`                       |
| `src/scenes/`            | Scene implementations                                 |
| `src/assets/manifest.js` | Image manifest, empty by default                      |
| `src/main.js`            | Composition root: wires input, audio, scenes, and starts the loop |

Engine modules: `game.js` (fixed-timestep loop, scene registry, DPR-aware resize),
`scene.js` (base class), `input.js` (action bindings and pointer state), `audio.js`
(WebAudio synth bus), `music.js` (step-sequenced miniboss themes), `render.js` (draw
helpers), `selectlist.js` (navigable list widget), `math.js`, `collision.js` (circle
overlap), `particles.js`, `assets.js` (image loader), `storage.js` (safe localStorage
JSON).

Game modules: `config.js` holds every tuning value referenced by `FEATURES.md`;
entities share the `Entity` base (center x/y, velocity, collision radius, age, alive);
scenes follow the `Scene` base (`enter`/`exit`/`update`/`render`); `ui/hud.js` consumes
a state object only, so it works with any gameplay content.

Build tooling lives in `scripts/`: `bundle.mjs` (module bundler), `minify.mjs`
(minifier), `build.mjs` (artifact writer), `dev.mjs` (static dev server), `smoke.mjs`
(headless verification). See sections 8–10 and 12.

## 2. Scenes and Transitions

- Scenes are registered in `src/main.js` with `game.register(name, scene)` and switched
  with `game.changeScene(name, params)`.
- Transitions are queued and applied at a fixed-step boundary, so a scene change during
  `update` never half-updates the outgoing scene.
- `enter(params)` receives mode payloads: `{ empty: true }` starts the empty tank test
  mode, `{ tank: 'stingray' | 'deepsea' | 'arctic' | 'jelly' | 'freshwater', carry }`
  starts a later tank with score, timer, bubbles, and elapsed time carried over, and
  `{ coop: true }` starts a two-player dive with two player creatures, one per player.
  `replayParams()` strips the carry so RESTART and PLAY AGAIN start fresh runs in the
  same tank, preserving the co-op flag.
- `TankSelectScene` (`tanks`) picks a starting tank and an optional co-op flag, then
  hands `PlayScene` the same `{ tank, coop }` payloads a normal run uses.
- `SettingsScene` (`settings`) holds the persisted `CO-OP TANK SELECT` switch, which
  pre-enables the co-op flag in the tank select.
- `DawnScene` (`dawn`) is the freshwater goal cutscene: the sun rises outside the
  aquarium window, and ENTER returns to the menu.
- Run completion is centralized in `PlayScene.completionPayload()`, which persists best
  score and stats for both the timer expiry and the freshwater goal.
- `PlayScene` reads the persisted difficulty from `SETTINGS_KEY` into `this.rules` and
  applies it as enemy speed, spawn interval, penalty, invulnerability grace, tank-clock,
  and pack charge-threshold scales.
- The freshwater chase is a side-scrolling scene: world entities move left at a fixed
  scroll speed while the player is pinned to a screen lane (`autoScrollX`), so no camera
  is needed; obstacles and bubble rows are culled once they leave the screen.
- Pause is a flag inside `PlayScene` rather than a separate scene, so gameplay state
  (score, timer, entities) is never torn down.
- `BootScene` loads `IMAGE_MANIFEST` and always proceeds to the menu; load failures are
  recorded as `error` on the scene so a broken manifest cannot brick startup.

## 3. Game Loop and Timing

- Fixed timestep: `FIXED_STEP = 1/60`; frame time is clamped to
  `MAX_FRAME_TIME = 0.25` and fed to an accumulator, so hitches cannot produce
  catch-up spirals.
- Rendering happens once per animation frame after all fixed steps for that frame; no
  interpolation between steps.
- The canvas backs at device pixel ratio; drawing uses 960×540 logical coordinates and
  CSS letterboxes the element. Resize is handled with `ResizeObserver` plus a window
  resize fallback.

## 4. Input

- `Input` maps raw key codes to actions (`left`, `right`, `up`, `down`, `confirm`,
  `pause`, `back`) via `DEFAULT_BINDINGS`, plus per-player movement sets
  (`left1`…`down2`).
- Co-op uses the per-player sets: P1 is `WASD`, P2 is the arrow keys, and pointer drag
  steers only P1.
- Pressed/released edges are cleared after each fixed step, so scenes read input edges
  exactly once.
- Pointer input is exposed as the virtual key `PointerPrimary` and as `input.pointer`
  (logical coordinates, `down`, and a `moved` flag that UI hover logic uses).
- Drag steering: while the pointer is held, `pointer.dragX`/`dragY` hold the offset from
  the press origin; the shark steers along that offset past `PLAYER.pointerDeadzone`.
- Window blur clears the held-key set to prevent stuck movement.

## 5. UI Components

- `Hud` (`src/ui/hud.js`): renderer driven by a state object
  `{ score, best, timeLeft, timeLimit, empty, coop, tank, eel, eelCharge, eelNeed,
  angler, seal, sealCharge, sealNeed, sunrise, turtle, minibossPoints, catfish, hidden }`,
  where `eel`, `angler`, `seal`, `turtle`, and `catfish` are phase strings or null; it
  owns only its animation clocks. Layout and behavior requirements are in
  `FEATURES.md` §7.
- `Hud` also exports `PAUSE_BUTTON` geometry and `hitPauseButton(x, y)`, so the play
  scene hit-tests taps on the on-screen pause button without duplicating layout.
- `SelectList` (`src/engine/selectlist.js`): keyboard navigation with wrapping, pointer
  hover selection, click-to-confirm, disabled entries, highlighted entries, and
  `onChange` / `onConfirm` callbacks. All screens use it, so navigation behavior is
  implemented once.
- Both are canvas-drawn; there is no DOM UI, which keeps the single-file artifact
  simple.

## 6. Assets and Audio Pipeline

- The single-file contract forbids runtime requests, so images must be inlined as data
  URIs in `IMAGE_MANIFEST` and audio is synthesized.
- `loadImages(manifest)` resolves a keyed map of `HTMLImageElement`s. The scaffold's
  manifest is empty and all art is procedural canvas drawing.
- `AudioBus.tone({ freq, endFreq, type, duration, volume, delay })` schedules oscillator
  envelopes. The context is created lazily; `src/main.js` unlocks it on the first
  pointer or key event, and the bus disables itself if WebAudio is unavailable.
- `AudioBus.setVolume(value)` scales the master bus (base gain 0.5) and
  `setSfxEnabled(flag)` mutes cues; `src/main.js` re-applies the persisted settings on
  startup.
- `MusicPlayer` (`src/engine/music.js`) step-sequences looping miniboss themes from
  `src/assets/tracks.js` (MIDI-note bass/lead arrays plus a beat length). `PlayScene`
  starts them for the jelly and freshwater tanks and drives the sequencer from its
  update, so music pauses with gameplay; scene transitions stop it via `Game`. 

## 7. Persistence

- `loadJSON(key, fallback)` / `saveJSON(key, value)` in `src/engine/storage.js` wrap
  `localStorage` and swallow errors, degrading to session-only state in private mode.
- Best score persists under `STORAGE_KEY`; lifetime stats persist under `STATS_KEY` and
  user settings under `SETTINGS_KEY` (all in `src/config.js`) — stats as
  `{ games, bubbles, longestRun }` and settings as
  `{ coopTankSelect, difficulty, volume, sfx }`.
- Stats are recorded only when a non-empty dive completes; the EMPTY TANK test mode
  never writes score or stats. Runs that teleport through the tanks count as one
  completed dive with the carried totals.

## 8. Single-File Artifact Contract

`node scripts/build.mjs` produces `dist/index.html` containing all CSS and JS inlined,
minified, and nothing else. The artifact runs from `file://` with no network requests.
Consequences:

- No external scripts, stylesheets, fonts, images, or audio at runtime.
- Images must be inlined as data URIs through `IMAGE_MANIFEST`
  (`src/assets/manifest.js`), e.g. `logo: 'data:image/png;base64,...'`.
- Prefer procedural drawing and synthesized audio as the scaffold does.
- The build fails loudly if an external `script src` or stylesheet link survives.

## 9. Bundler Constraints (`scripts/bundle.mjs`)

The zero-dependency bundler supports a deliberate subset of ES modules and fails fast
on anything else:

- Relative imports that point at `.js` files, with `.js` included in the specifier.
- Named imports (`import { a, b as c } from './x.js'`), namespace imports, and
  side-effect imports.
- Named exports only. One exported binding per declaration statement
  (`export const a = 1;` — not `export const a = 1, b = 2;`).
- No `export default`, `export *`, re-exports, default imports, dynamic `import()`,
  or `import.meta`.

## 10. Minification (`scripts/minify.mjs`)

Every build minifies the bundle, the inline CSS, and the HTML template with a
zero-dependency, conservative minifier:

- Comments and redundant whitespace are removed; string, template, and regex literals
  are passed through verbatim.
- Line terminators are preserved whenever automatic semicolon insertion could matter
  (after restricted keywords like `return`, or between an expression and something that
  could continue it), so ASI-style code keeps its exact semantics.
- The build syntax-checks the minified bundle with `node:vm` before writing it, and the
  smoke test runs against the minified artifact, so a minifier regression fails
  `node --run verify` before the artifact ships.

## 11. Conventions

- Logical resolution is 960×540; all gameplay math uses logical coordinates.
- Scenes own their entity collections; entities never reference the game directly.
- Source files carry no comments by convention; behavior is documented in `FEATURES.md`
  and `GAME_DESIGN.md`.
- The running game is exposed as `window.__game` for console debugging.

## 12. Workflow

No dependencies and no npm required. Use whatever runner is available:

| Task           | Command                                          |
| -------------- | ------------------------------------------------ |
| Dev server     | `node scripts/dev.mjs` → `http://localhost:5173/` |
| Build artifact | `node scripts/build.mjs`                         |
| Smoke test     | `node scripts/smoke.mjs` (after build)           |
| Build + smoke  | `node --run verify` (Node 22+)                   |
| Deploy (CI)    | `.github/workflows/pages.yml` — build, smoke, publish `dist/` to Pages |

Pushes to `master`/`main` (or a manual dispatch) run the Pages workflow: Node setup,
`node scripts/build.mjs`, `node scripts/smoke.mjs`, then the official Pages artifact
upload and deploy. One-time repository setup: **Settings → Pages → Source: GitHub
Actions**. The artifact has no external references, so it serves correctly from the
`/<repo>/` subpath.

The same scripts are exposed as `npm run dev` / `build` / `smoke` / `verify` for
environments with npm. The dev server serves the workspace over HTTP so native ES
modules work; `dist/index.html` needs no server at all.

The smoke test evaluates the built (minified) artifact against stubbed browser globals.
It drives boot → menu → play, exercises keyboard and pointer navigation (HOW TO PLAY
overlay, EMPTY TANK, hover and click selection), pause/resume via keyboard and the
on-screen button, drag steering, forced bonus content (golden bubble, angelfish,
sinking shrimps, and current/updraft zone contacts), persistent stats on completion,
the 60-point teleport
with score and timer carry-over, burrow crawling, bubble-gated eel hunts, eel pack
last-seen searching and bite penalties, the 250-point deep-sea teleport, crab sinking,
squid ledge hiding, anglerfish losing the trail, the 40-bubble arctic teleport, plankton
drift and collection, the 15-plankton seal dive, sardine-school concealment, seal bite
penalties, the 30-plankton jelly teleport, minnow tangling, turtle body penalties, head
stuns, miniboss clearing, the freshwater chase (lane pinning, bubble rows, rock
burrowing, plant tangles, piranha stuns, catfish bites, the freshwater difficulty ramp,
electric eel shocks and burrow safety, the 150-bubble goal opening the dawn cutscene,
the tank select with co-op toggle, the settings switches, difficulty selector, and
volume slider with persistence, co-op two-creature control, the empty tank clock
reaching game over, and the game over menu — failing on any runtime error.

## 13. Documentation Map

| File                  | Covers                                                                              | Update when                    |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------------------ |
| `README.md`           | Entry point: quick start, project layout, links to all other docs                   | Commands, structure, or doc layout change |
| `FEATURES.md`         | Lore, navigation, controls, entities, scoring, HUD requirements, art/audio direction, backlog | Gameplay behavior or values change |
| `GAME_DESIGN.md`      | Architecture, engine APIs, build pipeline, workflow                                 | Structure, tooling, or APIs change |
| `src/config.js`       | The tuning values themselves                                                        | Any tuning change — mirror it in `FEATURES.md` |

Rule of thumb: player-visible behavior and requirements go in `FEATURES.md`; how it is
built and where the code lives go in `GAME_DESIGN.md`. `README.md` is the entry point
that maps to everything else; keep its links and commands current.
