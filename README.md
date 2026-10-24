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
src/scenes/          boot, intro, menu, tank select, settings, shop, minigames, tag, dodgeball, labyrinth, track player, cutscene theatre, game trailer, aquarium builder and dive, play, game over, descent, dawn cutscene
src/entities/        each tank's player creatures, hazards, and collectibles
src/config.js        all game tuning and palette
src/assets/          image manifest (data URIs) + tank music tracks
scripts/             bundler, minifier, build, dev server, smoke test
.github/workflows/   GitHub Actions: build and deploy dist/ to GitHub Pages
```

## Documentation map

Start with the two documents below; everything player-facing is specified in
`FEATURES.md`, everything technical in `GAME_DESIGN.md`. The dated feature history lives
in `CHANGELOG.md`.

### [FEATURES.md](FEATURES.md) — game requirements

| Section | Topic |
| ------- | ----- |
| [§1](FEATURES.md#1-lore-and-setting) | Lore and setting |
| [§2](FEATURES.md#2-core-loop-and-session) | Core loop and session |
| [§3](FEATURES.md#3-navigation-and-screens) | Navigation and screens |
| [§4](FEATURES.md#4-controls) | Controls |
| [§5](FEATURES.md#5-entities) | Entities ([shark](FEATURES.md#51-shark-player), [bubble](FEATURES.md#52-bubble-collectible), [jellyfish](FEATURES.md#53-jellyfish-hazard), [golden bubble](FEATURES.md#54-golden-bubble-rare-collectible), [angelfish](FEATURES.md#55-angelfish-bonus), [zones](FEATURES.md#56-current-and-updraft-zones-environment), [stingray](FEATURES.md#57-stingray-stingray-tank-player), [eel pack](FEATURES.md#58-moray-eel-pack-stingray-tank-hazard), [archway](FEATURES.md#59-rock-archway-stingray-tank-scenery), [shrimp](FEATURES.md#510-red-shrimp-stingray-tank-bonus), [squid](FEATURES.md#511-squid-deep-sea-tank-player), [anglerfish](FEATURES.md#512-anglerfish-deep-sea-tank-hazard), [crab](FEATURES.md#513-crab-deep-sea-tank-bonus), [ledges](FEATURES.md#514-stone-ledges-deep-sea-tank-hiding-spots), [arctic shrimp](FEATURES.md#515-arctic-shrimp-arctic-tank-player), [seals](FEATURES.md#516-seals-arctic-tank-hazard), [plankton](FEATURES.md#517-plankton-arctic-tank-bonus), [sardine schools](FEATURES.md#518-sardine-schools-arctic-tank-hiding-spots), [ice chunk](FEATURES.md#519-ice-chunk-arctic-tank-scenery), [moon jelly](FEATURES.md#520-moon-jelly-jelly-tank-player), [turtle](FEATURES.md#521-turtle-jelly-tank-miniboss), [minnow](FEATURES.md#522-minnow-jelly-tank-collectible), [freshwater ray](FEATURES.md#523-freshwater-stingray-freshwater-tank-player), [catfish](FEATURES.md#524-catfish-freshwater-tank-chaser), [freshwater obstacles](FEATURES.md#525-freshwater-obstacles), [bubble lines](FEATURES.md#526-bubble-lines-freshwater-tank-goal), [electric eels](FEATURES.md#527-electric-eels-freshwater-tank-late-hazard), [coral](FEATURES.md#528-coral-reef-tank-scenery), [colorful school](FEATURES.md#529-colorful-school-reef-tank-cosmetics), [reef boulders](FEATURES.md#530-reef-boulders-reef-tank-corner-scenery), [nautilus](FEATURES.md#531-nautilus-nautilus-tank-player), [chaser shark](FEATURES.md#532-chaser-shark-nautilus-tank-chaser), [whale skeleton](FEATURES.md#533-whale-skeleton-nautilus-tank-obstacle), [dart eel](FEATURES.md#534-dart-eel-nautilus-tank-obstacle), [bait squid](FEATURES.md#535-bait-squid-nautilus-tank-interceptor), [kelp crab](FEATURES.md#536-kelp-crab-kelp-forest-tank-player), [octopus](FEATURES.md#537-octopus-kelp-forest-tank-boss), [kelp stalks](FEATURES.md#538-kelp-stalks-kelp-forest-tank-scenery), [tank backdrops](FEATURES.md#539-tank-backdrops-themed-decor), [pets tank](FEATURES.md#540-pets-tank-special-play), [pet menagerie](FEATURES.md#541-pet-menagerie-pets-tank-companions)) |
| [§6](FEATURES.md#6-scoring-progression-and-persistence) | Scoring, progression, persistence |
| [§7](FEATURES.md#7-hud-and-player-feedback) | HUD and player feedback |
| [§8](FEATURES.md#8-art-and-audio-direction) | Art and audio direction |
| [§9](FEATURES.md#9-test-modes) | Test modes |
| [§10](FEATURES.md#10-shop-sea-coins-and-minigames) | Shop, sea coins, and minigames |
| [§11](FEATURES.md#11-backlog) | Backlog |

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

### [CHANGELOG.md](CHANGELOG.md) — feature history

Dated feature batches, each split into game features and game systems.

Where new information belongs:

- Player-visible behavior, values, and requirements → `FEATURES.md`.
- Architecture, engine APIs, tooling, and workflow → `GAME_DESIGN.md`.
- Feature history by date → `CHANGELOG.md`.
- Tuning values themselves → `src/config.js`, mirrored in `FEATURES.md`.

## Deployment

Pushes to `master`/`main` (or a manual workflow dispatch) run
`.github/workflows/pages.yml`, which sets up Node, builds the minified
`dist/index.html`, smoke-tests it, and publishes `dist/` to GitHub Pages with the
official Pages actions. Enable this once in the repository settings with
**Settings → Pages → Source: GitHub Actions**.

The artifact is fully self-contained (inline CSS/JS, procedural art, synthesized
audio), so it serves correctly from the project subpath (`https://<owner>.github.io/<repo>/`).

## Verification

`node --run verify` rebuilds the minified artifact and runs the smoke test against it.
The smoke test evaluates `dist/index.html` in stubbed browser globals and drives the
full navigation flow (boot → intro → menu → play → pause → game over), the descent
cutscenes between tanks, drag steering, the
pause button, bonus entities and zones, persistent stats, the 60-point stingray
teleport, burrow crawling, bubble-gated moray hunts, moray bite penalties, the 250-point
deep-sea teleport, squid ledge hiding, anglerfish tracking loss, the 40-bubble arctic
teleport, sardine-school concealment with wandering seals and drifting plankton, the
30-plankton jelly teleport, minnow tangling, turtle head-stuns, the freshwater chase
(lane pinning, bubble rows, rock burrowing, plant tangles, piranha stuns, catfish
bites), the freshwater difficulty ramp with electric eels, the 150-bubble goal and dawn
cutscene, the nautilus descent (lane pinning, side steering, whale skeletons, darting
eels, squid interception and dodge-fed shark distraction, and its 120-bubble goal
opening the freshwater chase),
the per-tank music themes, tank selection with the
co-op toggle, the settings switches, the difficulty selector (through APOCALYPTIC
WIPEOUT), and the volume slider, the shop (a welcome sea-coin bank, difficulty-scaled
payouts with equipped-color bonuses, color purchases with creature browsing, cheap
accessories, the SHADOW and RAINBOW specials, and the
playpasses), the minigames
menu, the two-player competition race and its 1P target chase, the tag minigame with
named players, CPU
swimmers, random CPU targeting, and tag-separation pushes, solo tag and solo dodgeball
survival, difficulty-scaled minigame rules, the nine playpasses with their
pass-granted cosmetics (ragdoll plushies, the RGB neon jacket, eel aura rings, five swim
trails, twenty companion pals covering every playable creature and enemy, and dual
head/body trinket slots), the playerless pets tank with its snack-feeding (clicks and on-screen buttons),
despawn lures, saved progress, and
cross-level enemy waves (jellyfish, turtle, pufferfish, anglerfish, and morays) that bite the pets and drain the tally, minigame
coin rewards and win counters, pufferfish dodgeball with
its three lives, no timer, and endless escalation, the labyrinth escape with its
checkpoint masts, the part and per-player diver pickers, the GAME TRAILER, the all-tank gameplay gauntlet, the nested tank and minigame cut-downs, the LABYRINTH TRAILER, the joystick steering, tentacle wall and grabber lunges, its seven-part descent,
cracked-ground bursts, wall ambushes, ceiling chunks, the watching
squid, grab respawns, the moray tail-slide retreat, the grab-clump spawner, the slowest-diver wall cap, the stingray's disabled deck burrow, saved-part resume, the MEGASQUID ending, dread theme, and
co-op/solo
results, the kelp forest tank with its crab
player and octopus boss, the per-tank themed backdrops, the track player with every level theme
(including tracks held across scenes), the endless dive with its lives carry and
out-of-lives panel, the aquarium builder with its full palette, dive mode, chill toggle, and saved
layouts, and co-op
two-creature control — so code and build regressions surface immediately. The artifact
is a single HTML file with no external requests and can be opened from `file://`.
