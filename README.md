# Sharkquarium

A browser-based canvas game scaffold written in vanilla JavaScript, CSS, and HTML with
zero runtime dependencies. It builds to a single static `dist/index.html` that runs
offline straight from the filesystem.

The repo ships a starter concept (a shark collecting bubbles in a closing aquarium) as
a playable vertical slice, plus a fully navigable UI shell and a small reusable engine,
ready to be replaced or extended.

## Quick start

Requires Node.js 18+. No `npm install` needed.

```bash
node scripts/dev.mjs      # dev server → http://localhost:5173/
node scripts/build.mjs    # write the minified single-file artifact to dist/index.html
node scripts/smoke.mjs    # headless smoke test of the built artifact
node --run verify         # build + smoke (Node 22+)
```

`npm run dev` / `build` / `smoke` / `verify` work too where npm is available. See
[GAME_DESIGN.md §12](GAME_DESIGN.md#12-workflow) for the full workflow.

## Project layout

```
dist/index.html      generated single-file artifact (gitignored)
index.html           dev entry that loads the ES modules
styles/main.css      page shell styles
src/engine/          reusable engine (loop, scenes, input, audio, rendering, UI widgets)
src/ui/              game HUD
src/scenes/          boot, menu, tank select, settings, play, game over, dawn cutscene
src/entities/        shark, bubble, jellyfish
src/config.js        all game tuning and palette
src/assets/          image manifest (data URIs) + miniboss music tracks
scripts/             bundler, minifier, build, dev server, smoke test
```

## Documentation map

Start with the two documents below; everything player-facing is specified in
`FEATURES.md`, everything technical in `GAME_DESIGN.md`.

### [FEATURES.md](FEATURES.md) — game requirements

| Section | Topic |
| ------- | ----- |
| [§1](FEATURES.md#1-lore-and-setting) | Lore and setting |
| [§2](FEATURES.md#2-core-loop-and-session) | Core loop and session |
| [§3](FEATURES.md#3-navigation-and-screens) | Navigation and screens |
| [§4](FEATURES.md#4-controls) | Controls |
| [§5](FEATURES.md#5-entities) | Entities ([shark](FEATURES.md#51-shark-player), [bubble](FEATURES.md#52-bubble-collectible), [jellyfish](FEATURES.md#53-jellyfish-hazard), [golden bubble](FEATURES.md#54-golden-bubble-rare-collectible), [angelfish](FEATURES.md#55-angelfish-bonus), [zones](FEATURES.md#56-current-and-updraft-zones-environment), [stingray](FEATURES.md#57-stingray-stingray-tank-player), [eel pack](FEATURES.md#58-eel-pack-stingray-tank-hazard), [archway](FEATURES.md#59-rock-archway-stingray-tank-scenery), [shrimp](FEATURES.md#510-red-shrimp-stingray-tank-bonus), [squid](FEATURES.md#511-squid-deep-sea-tank-player), [anglerfish](FEATURES.md#512-anglerfish-deep-sea-tank-hazard), [crab](FEATURES.md#513-crab-deep-sea-tank-bonus), [ledges](FEATURES.md#514-stone-ledges-deep-sea-tank-hiding-spots), [arctic shrimp](FEATURES.md#515-arctic-shrimp-arctic-tank-player), [seals](FEATURES.md#516-seals-arctic-tank-hazard), [plankton](FEATURES.md#517-plankton-arctic-tank-bonus), [sardine schools](FEATURES.md#518-sardine-schools-arctic-tank-hiding-spots), [ice chunk](FEATURES.md#519-ice-chunk-arctic-tank-scenery), [moon jelly](FEATURES.md#520-moon-jelly-jelly-tank-player), [turtle](FEATURES.md#521-turtle-jelly-tank-miniboss), [minnow](FEATURES.md#522-minnow-jelly-tank-collectible), [freshwater ray](FEATURES.md#523-freshwater-stingray-freshwater-tank-player), [catfish](FEATURES.md#524-catfish-freshwater-tank-chaser), [freshwater obstacles](FEATURES.md#525-freshwater-obstacles), [bubble lines](FEATURES.md#526-bubble-lines-freshwater-tank-goal), [electric eels](FEATURES.md#527-electric-eels-freshwater-tank-late-hazard)) |
| [§6](FEATURES.md#6-scoring-progression-and-persistence) | Scoring, progression, persistence |
| [§7](FEATURES.md#7-hud-and-player-feedback) | HUD and player feedback |
| [§8](FEATURES.md#8-art-and-audio-direction) | Art and audio direction |
| [§9](FEATURES.md#9-test-modes) | Test modes |
| [§10](FEATURES.md#10-backlog) | Backlog |

### [GAME_DESIGN.md](GAME_DESIGN.md) — technical design

| Section | Topic |
| ------- | ----- |
| [§1](GAME_DESIGN.md#1-architecture) | Architecture |
| [§2](GAME_DESIGN.md#2-scenes-and-transitions) | Scenes and transitions |
| [§3](GAME_DESIGN.md#3-game-loop-and-timing) | Game loop and timing |
| [§4](GAME_DESIGN.md#4-input) | Input |
| [§5](GAME_DESIGN.md#5-ui-components) | UI components |
| [§6](GAME_DESIGN.md#6-assets-and-audio-pipeline) | Assets and audio pipeline |
| [§7](GAME_DESIGN.md#7-persistence) | Persistence |
| [§8](GAME_DESIGN.md#8-single-file-artifact-contract) | Single-file artifact contract |
| [§9](GAME_DESIGN.md#9-bundler-constraints-scriptsbundlemjs) | Bundler constraints |
| [§10](GAME_DESIGN.md#10-minification-scriptsminifymjs) | Minification |
| [§11](GAME_DESIGN.md#11-conventions) | Conventions |
| [§12](GAME_DESIGN.md#12-workflow) | Workflow |
| [§13](GAME_DESIGN.md#13-documentation-map) | Documentation map |

Where new information belongs:

- Player-visible behavior, values, and requirements → `FEATURES.md`.
- Architecture, engine APIs, tooling, and workflow → `GAME_DESIGN.md`.
- Tuning values themselves → `src/config.js`, mirrored in `FEATURES.md`.

## Verification

`node --run verify` rebuilds the minified artifact and runs the smoke test against it.
The smoke test evaluates `dist/index.html` in stubbed browser globals and drives the
full navigation flow (boot → menu → play → pause → game over), drag steering, the
pause button, bonus entities and zones, persistent stats, the 60-point stingray
teleport, burrow crawling, bubble-gated eel hunts, eel bite penalties, the 250-point
deep-sea teleport, squid ledge hiding, anglerfish tracking loss, the 40-bubble arctic
teleport, sardine-school concealment with wandering seals and drifting plankton, the
30-plankton jelly teleport, minnow tangling, turtle head-stuns, the freshwater chase
(lane pinning, bubble rows, rock burrowing, plant tangles, piranha stuns, catfish
bites), the freshwater difficulty ramp with electric eels, the 150-bubble goal and dawn
cutscene, miniboss music in the jelly and freshwater tanks, tank selection with the
co-op toggle, the settings switches, difficulty selector, and volume slider, and co-op
two-creature control — so code and build regressions surface immediately. The artifact
is a single HTML file with no external requests and can be opened from `file://`.
