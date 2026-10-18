# Sharkquarium — Game Design

This document is the source of truth for game-specific work. The scaffold currently
implements the starter concept described below; replace or extend these sections as the
design evolves. Engine code (`src/engine/`) is intentionally game-agnostic and should not
need to change when the game design changes.

## 1. Concept

You are a small shark exploring a cozy aquarium at closing time. Time is running out,
bubbles drift toward the surface, and grumpy jellyfish are drifting through the tank.
Collect as many bubbles as you can before the clock hits zero.

- Session length: about one minute per run.
- Fantasy: fluid, slightly floaty swimming with snappy feedback.
- Tone: calm and friendly, no gore, no text-heavy UI.

## 2. Core Loop

1. Dive starts with a 30 second timer.
2. Collect bubbles: each is worth 1 point and adds 1.25 seconds back to the timer.
3. Touch a jellyfish: lose 3 seconds, get knocked back, and briefly flash invulnerable.
4. Timer reaches zero: show score, save the best score, offer another dive.

The loop rewards greedy, smooth swimming: chaining bubbles extends the run, so the
difficulty curve is player-driven rather than scripted.

## 3. Controls

| Action   | Bindings                              |
| -------- | ------------------------------------- |
| Move     | `WASD` / arrow keys                   |
| Pause    | `Escape` / `P`                        |
| Confirm  | `Enter` / `Space` / mouse / tap       |
| Back     | `Escape` (menu scenes only)           |

Menus are navigated with `Up`/`Down` (or mouse hover) and confirmed with `Enter` or a
click. Bindings live in `DEFAULT_BINDINGS` in `src/engine/input.js`. The pointer is
exposed as the virtual key `PointerPrimary`, so it can be bound like any keyboard key;
`Input.pointer` also tracks position and whether the pointer moved this frame so UI
widgets can support hover.

## 4. Entities

All entities extend `Entity` (`src/entities/entity.js`): center `x`/`y`, `vx`/`vy`,
collision `radius`, `age`, `alive` flag, and `update(dt)` / `render(ctx)`.

| Entity    | File                       | Collision radius | Behavior                                                 |
| --------- | -------------------------- | ---------------- | -------------------------------------------------------- |
| Shark     | `src/entities/shark.js`    | 26               | Exponential steering toward input, clamped to the tank    |
| Bubble    | `src/entities/bubble.js`   | 9–14             | Rises 55–95 px/s with a sine wobble                       |
| Jellyfish | `src/entities/jellyfish.js`| 24               | Vertical bob (40–80 px) and slow horizontal drift         |

Tuning constants live in `src/config.js` (`PLAYER`, `BUBBLE`, `HAZARD`, `ROUND`).

### Spawning

| Spawn      | Interval        | Cap | Notes                                        |
| ---------- | --------------- | --- | -------------------------------------------- |
| Bubble     | 0.45–0.95 s     | 14  | Uniform random `x`, spawned below the tank    |
| Jellyfish  | 4.5–7.5 s       | 3   | Kept at least 240 px away from the player     |

### Interactions

| Contact          | Effects                                                                       |
| ---------------- | ----------------------------------------------------------------------------- |
| Shark ↔ Bubble   | Bubble pops, +1 point, +1.25 s, foam particles, rising "pop" blip              |
| Shark ↔ Jelly    | −3 s, knockback impulse 520, 1.2 s invulnerability, red flash, screen shake    |

## 5. Scoring and Progression

- Score = bubbles collected. The timer is the only resource; there are no lives.
- Best score persists in `localStorage` under `sharkquarium.best-score`.
- Current build uses constant spawn rates. Suggested next steps: ramp spawn rate with
  elapsed time, raise the jellyfish cap after 30 s, and add a rare golden bubble worth
  +5 s.

## 6. Scene Flow

```
boot ──▶ menu ──▶ play ⇄ (paused) ──▶ gameover ──▶ play or menu
```

| Scene   | Class           | File                      |
| ------- | --------------- | ------------------------- |
| Boot    | `BootScene`     | `src/scenes/boot.js`      |
| Menu    | `MenuScene`     | `src/scenes/menu.js`      |
| Play    | `PlayScene`     | `src/scenes/play.js`      |
| Gameover| `GameOverScene` | `src/scenes/gameover.js`  |

Pause is a flag inside `PlayScene` rather than a separate scene, so gameplay state is
never torn down. Every screen is navigable without any game content: the menu offers
`EMPTY TANK`, which starts a dive with spawning disabled and a 10 second clock, so the
whole shell (HUD, pause menu, game over) can be exercised while the game is a stub.
Add scenes with `game.register(name, new Scene())` in `src/main.js` and switch with
`this.game.changeScene(name, params)`.

Navigable surfaces:

| Surface       | Options                                  | Notes |
| ------------- | ---------------------------------------- | ----- |
| Main menu     | START DIVE, HOW TO PLAY, EMPTY TANK      | HOW TO PLAY opens an in-scene overlay closed with Enter/Esc |
| Pause overlay | RESUME, RESTART, QUIT TO MENU            | Esc also resumes; RESTART keeps mode params |
| Game over     | PLAY AGAIN, MENU                         | PLAY AGAIN preserves the previous mode (empty or full) |

## 7. Presentation

Palette (see `COLORS` in `src/config.js`): abyss `#04101d`, deep `#0a2740`, bubble
`#cfefff`, accent `#ffd166`, danger `#ff6b81`, jelly `#ff8fa3`.

- Art is 100% procedural canvas drawing. No image files are required.
- Backdrop: vertical gradient, three swaying light shafts, vignette (`drawWater`).
- Feedback: particle bursts, red hit flash, screen shake, invulnerable blinking.
- Audio is synthesized with WebAudio oscillators (`AudioBus.tone`) — no sound files.

Sound cues as implemented:

| Cue        | Shape                                      |
| ---------- | ------------------------------------------ |
| UI confirm | Sine 300 → 620 Hz, 0.14–0.16 s (menu choices, pause actions, game over) |
| UI back    | Sine 520 → 320 Hz, 0.1 s (closing HOW TO PLAY) |
| UI navigate| Sine 640 Hz blip, 0.05 s (SelectList selection changes) |
| Pause      | Sine 300 Hz pause / 560 Hz resume, 0.08 s  |
| Bubble pop | Triangle 480 → 900 Hz, 0.11 s              |
| Jelly hit  | Sawtooth 160 → 70 Hz, 0.3 s                |
| Low time   | Square 720 Hz ticks at ≤ 5 seconds         |
| Game over  | Triangle arpeggio 392 / 523 / 659 Hz       |

## 8. HUD and UX

The HUD is a standalone component (`src/ui/hud.js`) that only consumes a state object
`{ score, best, timeLeft, timeLimit, empty }`, so it keeps working for any game content
(including none):

- Top-left: bubble icon and current score; the icon and number pulse gold when the score
  increases.
- Top-right: best score.
- Top-center: time bar (smoothed toward `timeLeft / timeLimit`) with a numeric countdown;
  the bar and countdown turn red and pulse during the last 5 seconds.
- Bottom-right: pause hint.
- Bottom-center: `EMPTY TANK — UI TEST` badge when running without content.

Menus and overlays are rendered with a reusable `SelectList` widget
(`src/engine/selectlist.js`): keyboard navigation, wrapping selection, pointer hover
selection, click-to-confirm, disabled entries, and pulsing chevron indicators. Scenes
wire `onChange` / `onConfirm` callbacks to play UI sounds and trigger actions.

Additional feedback: particle bursts, red hit flash, screen shake, invulnerable
blinking, and the elastic scale-in on the game over panel.

## 9. Persistence

Single key: `sharkquarium.best-score` holding a number. See `src/engine/storage.js`.
`loadJSON` / `saveJSON` swallow storage errors, so private-mode failures degrade to
session-only scoring.

## 10. Technical Architecture

### Layers

| Path                       | Responsibility                                    |
| -------------------------- | ------------------------------------------------- |
| `src/engine/`              | Reusable engine: loop, scenes, input, audio, etc. |
| `src/ui/`                  | Game HUD and other composable UI pieces           |
| `src/config.js`            | All game tuning and palette                       |
| `src/entities/`            | Game entities                                     |
| `src/scenes/`              | Scene implementations                             |
| `src/assets/manifest.js`   | Image manifest (currently empty)                  |
| `src/main.js`              | Composition root: wires everything together       |

Engine modules: `game.js` (fixed 1/60 s timestep loop, scene registry, DPR-aware
resize), `scene.js` (base class), `input.js` (action bindings), `audio.js` (WebAudio
synth bus), `render.js` (draw helpers), `selectlist.js` (navigable menu list),
`math.js`, `collision.js` (circle overlap), `particles.js`, `assets.js` (image loader),
`storage.js`. Game UI lives in `src/ui/hud.js`.

### Single-file artifact contract

`node scripts/build.mjs` produces `dist/index.html` containing all CSS and JS inlined,
minified, and nothing else. The artifact runs from `file://` with no network requests.
Consequences:

- No external scripts, stylesheets, fonts, images, or audio at runtime.
- Images must be inlined as data URIs through `IMAGE_MANIFEST`
  (`src/assets/manifest.js`), e.g. `logo: 'data:image/png;base64,...'`.
- Prefer procedural drawing and synthesized audio as the scaffold does.
- The build fails loudly if an external `script src` or stylesheet link survives.

### Bundler constraints (`scripts/bundle.mjs`)

The zero-dependency bundler supports a deliberate subset of ES modules and fails fast
on anything else:

- Relative imports that point at `.js` files, with `.js` included in the specifier.
- Named imports (`import { a, b as c } from './x.js'`), namespace imports, and
  side-effect imports.
- Named exports only. One exported binding per declaration statement
  (`export const a = 1;` — not `export const a = 1, b = 2;`).
- No `export default`, `export *`, re-exports, default imports, dynamic `import()`,
  or `import.meta`.

### Minification (`scripts/minify.mjs`)

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

### Conventions

- Logical resolution is 960×540; the canvas backs at device pixel ratio and CSS handles
  letterboxing, so all gameplay math uses logical coordinates.
- Fixed timestep updates (1/60 s) with a max frame clamp of 0.25 s.
- Scenes own their entity collections; entities never reference the game directly.
- The running game is exposed as `window.__game` for console debugging.

## 11. Workflow

No dependencies and no npm required. Use whatever runner is available:

| Task             | Command                              |
| ---------------- | ------------------------------------ |
| Dev server       | `node scripts/dev.mjs` → `http://localhost:5173/` |
| Build artifact   | `node scripts/build.mjs`             |
| Smoke test       | `node scripts/smoke.mjs` (after build) |
| Build + smoke    | `node --run verify` (Node 22+)       |

The same scripts are exposed as `npm run dev` / `build` / `smoke` / `verify` for
environments with npm. The dev server serves the workspace over HTTP so native ES
modules work; `dist/index.html` needs no server at all.

The smoke test evaluates the built (minified) artifact against stubbed browser globals.
It drives boot → menu → play, exercises keyboard and pointer navigation (HOW TO PLAY
overlay, EMPTY TANK, hover and click selection), pause/resume, the pause menu (RESTART,
QUIT TO MENU), the empty tank clock reaching game over, and the game over menu — failing
on any runtime error.

## 12. Roadmap

- [ ] Replace the starter concept with the real design.
- [ ] Difficulty ramp: spawn-rate and hazard-cap curves over elapsed time.
- [ ] New entities: golden bubble, angelfish bonus, current/updraft zones.
- [ ] Touch controls: drag-to-swim, on-screen pause.
- [ ] Persistent stats: games played, total bubbles, longest run.
