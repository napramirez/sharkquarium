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
(WebAudio synth bus), `music.js` (step-sequenced tank themes), `render.js` (draw
helpers), `selectlist.js` (navigable list widget), `joystick.js` (on-screen thumbstick),
`skin.js` (shop color catalog and player recoloring), `accessory.js` (shop trinkets
rendered onto the creatures), `progress.js` (minigame rewards and counters), `math.js`, `collision.js` (circle
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
- `ShopScene` (`shop`) sells character colors, cheap accessories, and the competitions
  playpass with sea coins, previewing each of the seven playable creatures in the selected
  color (wearing the browsed accessory), and persisting
  `{ owned, skin, passes, accessories, accessory }` under `SHOP_KEY` and the bank under
  `COINS_KEY`. `MinigamesScene` (`minigames`) lists the unlocked playpass content and
  starts the two-player race with `{ race: true }`; `PlayScene` then forces co-op and
  neutral NORMAL tuning, tracks per-player bubble counts (`playerBubbles`), skips the
  tank chain and best/stat/coin writes, and hands the race results to the game over
  panel. The active color is applied at render time via `skin.js` — entities call
  `playerColor(slot, fallback)`, so specials like SHADOW (pulsing red accents) and
  RAINBOW (hue cycling) work across every creature.
- `TrackPlayerScene` (`tracks`, opened from SETTINGS) lists `TRACK_LIBRARY` from
  `src/assets/tracks.js` and plays or stops any tank theme through the shared
  `MusicPlayer`; playing sets `music.hold`, so the chosen theme keeps playing after the
  player is left, until it is stopped there or a dive takes over.
- `DodgeballScene` (`dodgeball`) is the third minigame: two shark players with three
  lives each dodge `Pufferfish` that telegraph at an arena edge (charge state with an
  inflation grow and warning ring) before flying across on wobbling lines. Hits pop the
  fish, cost a life, knock the player back, and grant blinking invulnerability; there is
  no clock — the first player to lose all three lives ends the round (`winner` index,
  `-1` on a double KO). `difficulty()` derives the endless curve from `elapsed`: spawn,
  speed, and telegraph scales plus aimed-shot and double-volley chances all tighten past
  the ramp, with hard ceilings so it stays readable. It renders the equipped skin and
  accessory on both players.
- The kelp forest is a standard arena tank with a boss: `KelpForest` scenery stalks, the
  `Octopus` boss (a Turtle-shaped state machine — patrol/lunge/recover/stunned with a
  `headPosition()` hitbox), the `KelpCrab` player, and a mossy floor. Ramming the head
  stuns the boss, awards +10, and bursts four free bubbles; the 25-bubble goal teleports
  into the jelly tank. It sits between the arctic tank (30 plankton) and the jelly
  miniboss in the chain.
- Every tank also gets a `Decor` layer (`src/entities/decor.js`) behind gameplay —
  per-tank themed scenery drawn from seeded item lists (starfish, vents, floes, spores,
  lily pads, motes, shells).
- `TagScene` (`tag`) is the second minigame: phases `names` → `play` → `results`. Name
  entry reads raw key codes from `Input.pressed` (letters/digits/Backspace, Enter
  advances), CPU names come from `TAG.cpuNames` minus the player names, and the
  1760×990 world is rendered at a 960/1760 scale so the whole arena fits on screen.
  `TagSwimmer` handles the two players (co-op key sets) and CPU flee/chase steering —
  a CPU tagger chases a persistent random target (`pickRandomTarget`, re-rolled by
  `giveTagger`) rather than the nearest swimmer;
  tags transfer on contact with a cooldown and a separation push that shoves the newly
  tagged swimmer away from the original tagger, the tagger's name flashes, and the round
  clock decides the loser on the results panel.
- Run completion is centralized in `PlayScene.completionPayload()`, which persists best
  score and stats for both the timer expiry and the freshwater goal.
- `PlayScene` reads the persisted difficulty from `SETTINGS_KEY` into `this.rules` and
  applies it as enemy speed, spawn interval, penalty, invulnerability grace, tank-clock,
  pack charge-threshold, ramp-speed, and hazard-cap scales.
- The freshwater chase is a side-scrolling scene: world entities move left at a fixed
  scroll speed while the player is pinned to a screen lane (`autoScrollX`), so no camera
  is needed; obstacles and bubble rows are culled once they leave the screen.
- The nautilus chase is the same scene rotated 90°: world entities (skeletons, darting
  eels, bait squids, bubble columns) move upward at `this.scrollSpeed` while the player
  is pinned to a depth lane (`autoScrollY`) and only horizontal input steers. The chasing
  shark is the catfish counterpart — creeps down, bites, and is distracted by squids that
  slip past the player. Its 120-bubble goal teleports into the Freshwater Tank with the
  standard carry payload, so the chase sits between the Jelly Tank miniboss and the
  river finale.
- Pause is a flag inside `PlayScene` rather than a separate scene, so gameplay state
  (score, timer, entities) is never torn down.
- `BootScene` loads `IMAGE_MANIFEST` and always proceeds to the intro splash; load
  failures are recorded as `error` on the scene so a broken manifest cannot brick
  startup.
- `IntroScene` (`intro`) is the boot splash: the story cards and ambient shark (with the
  equipped skin and accessory) over the water palette; ENTER or a click begins, and it
  auto-advances after 8 s.
- `TeleportScene` (`descent`) is the teleport interstitial: `PlayScene.teleport()` routes
  the co-op flag and carry payload through it, the tank name and tagline (`TANK_INTROS`)
  rise through streaking bubbles, and confirm/click or 1.7 s continues into the next
  tank — so the arrival banner lives here instead of inside play.

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
- The on-screen joystick (`src/engine/joystick.js`) reuses the drag model: a press whose
  origin lands inside the bottom-right pad draws a knob and steers P1 with the drag
  vector; `hitJoystick`/`joystickState` own the geometry and the play scene renders it
  above the HUD.
- Window blur clears the held-key set to prevent stuck movement.

## 5. UI Components

- `Hud` (`src/ui/hud.js`): renderer driven by a state object
  `{ score, best, timeLeft, timeLimit, empty, coop, tank, eel, eelCharge, eelNeed,
  angler, seal, sealCharge, sealNeed, sunrise, turtle, minibossPoints, catfish, nautilus,
  depth, race, hidden }`,
  where `eel`, `angler`, `seal`, `turtle`, `octopus`, `catfish`, and `nautilus` are phase strings or
  null and `race` is a two-value per-player bubble array or null; it owns only its
  animation clocks. Layout and behavior requirements are in `FEATURES.md` §7.
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
- `MusicPlayer` (`src/engine/music.js`) step-sequences looping tank themes from
  `src/assets/tracks.js` (MIDI-note bass/lead arrays plus a beat length). `Game` drives
  the sequencer every fixed step, so any held theme keeps playing in any scene; play
  scenes pick the theme from their tank-to-track map (the empty test tank stays silent)
  and set `music.paused` with the pause overlay, so music still pauses with gameplay.
  Scene transitions stop playback via `Game` unless `music.hold` is set — the track
  player sets it for on-demand listening, and starting a dive clears it. Transitions,
  `play()`, and `stop()` all clear the pause flag, so a theme can never resume silently.

## 7. Persistence

- `loadJSON(key, fallback)` / `saveJSON(key, value)` in `src/engine/storage.js` wrap
  `localStorage` and swallow errors, degrading to session-only state in private mode.
- Best score persists under `STORAGE_KEY`; lifetime stats persist under `STATS_KEY` and
  user settings under `SETTINGS_KEY` (all in `src/config.js`) — stats as
  `{ games, bubbles, longestRun, minigames, minigameWins }` and settings as
  `{ coopTankSelect, difficulty, volume, sfx }`. Lifetime stats gain `minigames` and
  `minigameWins`, written by `recordMinigame()` in `src/engine/progress.js`, which also
  banks minigame coin rewards (30 + 60 win bonus). Shop progress persists under `SHOP_KEY`
  as `{ owned, skin, passes, accessories, accessory }` and the sea-coin bank under
  `COINS_KEY` (defaulting to the 500-coin welcome bank on first read). Dive payouts multiply the difficulty scale
  by the equipped color's cost bonus (`1 + cost / 8000`).
- Stats are recorded only when a non-empty dive completes; the EMPTY TANK test mode and
  competitions never write score, stats, or coins. Runs that teleport through the tanks
  count as one completed dive with the carried totals.

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
It drives boot → intro → menu → play, exercises keyboard and pointer navigation (HOW TO PLAY
overlay, EMPTY TANK, hover and click selection), pause/resume via keyboard and the
on-screen button, drag steering, solo WASD steering, the on-screen joystick, forced
bonus content (golden bubble, angelfish,
sinking shrimps, and current/updraft zone contacts), persistent stats on completion,
per-tank theme switches (reef, stingray, deep sea, arctic, jelly, freshwater, and
silence in the empty tank),
the intro splash skip, a descent cutscene for every
teleport (skipped in tests), the 60-point teleport
with score and timer carry-over, burrow crawling, bubble-gated eel hunts, eel pack
last-seen roaming and bite penalties, the 250-point deep-sea teleport, crab sinking,
squid ledge hiding, anglerfish spawn spacing, separation, and losing the trail, the 40-bubble arctic teleport, plankton
drift and collection, the 15-plankton seal dive, sardine-school concealment, seal bite
penalties, the 30-plankton jelly teleport, minnow tangling, turtle body penalties, head
stuns, miniboss clearing, the freshwater chase (lane pinning, bubble rows, rock
burrowing, plant tangles, piranha stuns, catfish bites, the freshwater difficulty ramp,
electric eel shocks and burrow safety, the 150-bubble goal opening the dawn cutscene,
the nautilus chase (lane pinning, hole-free side steering, whale skeleton and darting eel
penalties, squid interception with paralysis, dodge-fed shark distraction, shark bites,
the depth ramp, and the 120-bubble goal opening the freshwater chase),
the tank select with co-op toggle, the settings switches, difficulty selector (through
APOCALYPTIC WIPEOUT), and
volume slider with persistence, co-op two-creature control, the empty tank clock
reaching game over, and the game over menu — failing on any runtime error. It also
covers the shop (coin banking with difficulty scaling, failed and successful purchases,
the SHADOW/RAINBOW specials persisting, accessory buying/wearing/removal, and the
playpass), the minigames menu, the
two-player competition race with per-player bubble credit and race results, the tag
minigame (name entry, distinct CPU names, random tagger, CPU random-target chasing,
tag transfers with the separation push, the flash, and the 60-second results), minigame
coin rewards and win/loss counters, the kelp forest chain (arctic plankton gate, kelp
stalks, the octopus patrol/lunge/head-stun with its bubble burst, and the 25-bubble goal
opening the jelly tank), the per-tank decor layers, the
pufferfish dodgeball knockout (telegraphs, life losses, invulnerability protection,
the endless difficulty ramp with aimed shots and capped scaling, and the no-timer
knockout ending),, the track
player (listing, playing, stopping, and holding every level theme across scene changes),
the reef
tank's decorative coral bed, its two corner boulders, and the cosmetic
colorful school swimming past, asserting that the school cannot be collected and never
touches the score.

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
