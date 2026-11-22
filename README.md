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
src/scenes/          boot, intro, menu, tank select, settings, shop, minigames, tag, AI chat (FINN the CPU), dodgeball, dress up battle, labyrinth, puffer ball, school roundup, stealth dive, trench dive, trench explore, jelly ascent, reef cleanup, abyss boss, reef swarm queen, raycast maze, mysteriously quiet horror tank, the escape chase, the watcher look-away horror tank, the trench mouth anchor-against-the-gulp horror tank, the prehistoric lungfish chase tank, the playtoy toy-liner exploration tank, mutators screen, boss rush gauntlet, records board, REEF RUSH levels, paged briefings and course builder, track player, cutscene theatre, game trailer, movie and shop trailers, lore codex, aquarium builder and dive, play, game over, descent, dawn cutscene, the twilight and goblin-deep loosejaw tanks, the whale fall, the hagfish bloom, the oarfish, the six real-fish tanks (archer's mangrove, thresher's lagoon, sawfish flats, tide-pool walker, frogfish garden, sunfish drift), the evolution tank, the reef rush shop, and the account screen
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
| [§5](FEATURES.md#5-entities) | Entities ([shark](FEATURES.md#51-shark-player), [bubble](FEATURES.md#52-bubble-collectible), [jellyfish](FEATURES.md#53-jellyfish-hazard), [golden bubble](FEATURES.md#54-golden-bubble-rare-collectible), [angelfish](FEATURES.md#55-angelfish-bonus), [zones](FEATURES.md#56-current-and-updraft-zones-environment), [stingray](FEATURES.md#57-stingray-stingray-tank-player), [eel pack](FEATURES.md#58-moray-eel-pack-stingray-tank-hazard), [archway](FEATURES.md#59-rock-archway-stingray-tank-scenery), [shrimp](FEATURES.md#510-red-shrimp-stingray-tank-bonus), [squid](FEATURES.md#511-squid-deep-sea-tank-player), [anglerfish](FEATURES.md#512-anglerfish-deep-sea-tank-hazard), [crab](FEATURES.md#513-crab-deep-sea-tank-bonus), [ledges](FEATURES.md#514-stone-ledges-deep-sea-tank-hiding-spots), [arctic shrimp](FEATURES.md#515-arctic-shrimp-arctic-tank-player), [seals](FEATURES.md#516-seals-arctic-tank-hazard), [plankton](FEATURES.md#517-plankton-arctic-tank-bonus), [sardine schools](FEATURES.md#518-sardine-schools-arctic-tank-hiding-spots), [ice chunk](FEATURES.md#519-ice-chunk-arctic-tank-scenery), [moon jelly](FEATURES.md#520-moon-jelly-jelly-tank-player), [turtle](FEATURES.md#521-turtle-jelly-tank-miniboss), [minnow](FEATURES.md#522-minnow-jelly-tank-collectible), [freshwater ray](FEATURES.md#523-freshwater-stingray-freshwater-tank-player), [catfish](FEATURES.md#524-catfish-freshwater-tank-chaser), [freshwater obstacles](FEATURES.md#525-freshwater-obstacles), [bubble lines](FEATURES.md#526-bubble-lines-freshwater-tank-goal), [electric eels](FEATURES.md#527-electric-eels-freshwater-tank-late-hazard), [coral](FEATURES.md#528-coral-reef-tank-scenery), [colorful school](FEATURES.md#529-colorful-school-reef-tank-cosmetics), [reef boulders](FEATURES.md#530-reef-boulders-reef-tank-corner-scenery), [nautilus](FEATURES.md#531-nautilus-nautilus-tank-player), [chaser shark](FEATURES.md#532-chaser-shark-nautilus-tank-chaser), [whale skeleton](FEATURES.md#533-whale-skeleton-nautilus-tank-obstacle), [zip eel](FEATURES.md#534-zip-eel-nautilus-tank-obstacle), [bait squid](FEATURES.md#535-bait-squid-nautilus-tank-interceptor), [kelp crab](FEATURES.md#536-kelp-crab-kelp-forest-tank-player), [octopus](FEATURES.md#537-octopus-kelp-forest-tank-boss), [kelp stalks](FEATURES.md#538-kelp-stalks-kelp-forest-tank-scenery), [tank backdrops](FEATURES.md#539-tank-backdrops-themed-decor), [pets tank](FEATURES.md#540-pets-tank-special-play), [pet menagerie](FEATURES.md#541-pet-menagerie-pets-tank-companions)) |
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
co-op toggle (a scrolling window that keeps every tank reachable), the ABYSS TRENCH leviathan and REEF SWARM QUEEN boss arenas and the RAYCAST first-person wreck maze, the MYSTERIOUSLY QUIET horror stealth tank (a labyrinth-style abandoned lab in sections with a diver picker and an intergalactic atom rift arrival cutscene, hunted by the finless, eyeless ECHOEEL with a split needle-toothed head that hears your noise, echolocation pings, hide alcoves, a near-black lab lit only by a small light around your diver that tightens as it nears, movement that makes noise, steam vents, slamming bulkheads, the remains of the lab's dead scientists, false-echo hallucinations, checkpoint masts that respawn you at the last sector, a last-second echoeel lunge that barely misses as you slip through the hatch, a proximity heartbeat and ambient horror sound, several jumpscare variants, and a first-person raycast option, scored by its own slow horror drone theme), THE ESCAPE (the standalone escape chase carved from the quiet lab's climax: the ECHOEEL relentless from the first second, a collapsing debris-strewn corridor, checkpoint masts, a pure dash to the exit, and an escape cutscene where it crashes through a glass pane and its weight and speed sink it into the trench), THE WATCHER (the look-away horror tank: your gaze is the only light and only weapon, single-eyed watchers petrify in the beam and only crawl when unobserved, a stare meter forces blinks that let them surge, checkpoint respawns, and a first-person beam), THE TRENCH MOUTH (the anchor-against-the-gulp horror tank: the floor is one colossal maw that breathes, drags, and snaps, ceiling anchors brace you with SPACE, checkpoint respawns, and a first-person route), the PREHISTORIC TANK (you play a lungfish fleeing a Dunkleosteus through the Devonian sea, a Velociraptor across a swamp by fin, and a Titanoboa that drops from a tree across land and water), the settings switches (including the 3D MODE that renders every object and background in 3D and the first-person raycast view over every dive and minigame), the difficulty selector (through FRENZY
DOMINANCE), and the volume slider, the shop (a welcome sea-coin bank, difficulty-scaled
payouts with equipped-color bonuses, color purchases with creature browsing, cheap
accessories, the SHADOW, RAINBOW and red-sparking CHAOS specials (with matching chaos
trinket variants), and the
playpasses), the minigames
menu, the two-player competition race and its 1P target chase, the tag minigame with
named players, CPU
swimmers, random CPU targeting, and tag-separation pushes, solo tag and solo dodgeball
survival, difficulty-scaled minigame rules, the seven paid arcade games (puffer ball
against the CPU, school roundup, stealth dive, trench dive with its always-reachable ice
gaps, trench explore — the timeless buoyancy dive (cosmetic morays, crabs, seaweed, octopus/squid corals, and a rainbow of twenty-one catchable stingrays (spotted, gray, tiger, blue, green, violet, crimson, red, sunset, mint, gold, silver, pink, cyan, copper, night, and baby rays) that unlock free color skins, and floor crabs that burrow under the sand when cornered) where you sink under the surface net and
out to the megasquid boss, jelly ascent, and the
no-clock reef cleanup whose morays peek, bite, and retreat), dress up battle (a 2P cosmetics brawl — dress in an in-game shop, then lunge and deploy your aura, with each cosmetic acting as a weapon), the nine playpasses with their
pass-granted cosmetics (ragdoll plushies, the RGB neon jacket, eel aura rings, five swim
trails, twenty-one companion pals covering every playable creature and enemy —
including the MINI MEGASQUID — and
head/body trinket slots plus the COSTUMES row and cheap EMOTES (equip one, press V in a dive on any creature —
CHAIN-FIN TRANSFORM reaches a fin/tentacle to the tummy rip cord to slide the chainsaw visor on and off, plus SPIN BARREL ROLL, BOOP, TAIL WIGGLE, and BUBBLE BLOW), the 2P
wardrobe with its PLAYER row and per-player buddy,
trail, and aura slots, the lore codex with its seven sections (and auto-paged long entries), the playerless pets tank
with its snack-feeding (clicks and on-screen buttons),
despawn lures, saved progress, pet tricks, toys, postcards, and meal packs, and
cross-level enemy waves (jellyfish, turtle, pufferfish, anglerfish, and morays) that bite the pets and drain the tally, minigame
coin rewards and win counters, pufferfish dodgeball with
its three lives, no timer, and endless escalation, the labyrinth escape with its
checkpoint masts, the part and per-player diver pickers, the WRECK ARRIVAL cutscene, the flooded-lab escape and megasquid-rising cutscenes, the GAME TRAILER, the all-tank gameplay gauntlet, the SHARKQUARIUM: THE MOVIE and SHOP TRAILER reels, the nested tank and minigame cut-downs, the LABYRINTH TRAILER, the joystick steering, tentacle wall and grabber lunges, its seven-part descent,
cracked-ground bursts, wall ambushes, ceiling feeding spears, ceiling chunks and the collapsing ceiling stubs that crash onto the tangle, the floor-stub morays that rear up and bite, the watching
squid, grab respawns, the moray tail-slide retreat, the grab-clump spawner, the slowest-diver wall cap, the stingray's disabled deck burrow, saved-part resume, the two-beat MEGASQUID ending, dread theme, and
co-op/solo
results, the kelp forest tank with its crab
player and octopus boss, the per-tank themed backdrops, the track player with every level theme
(including tracks held across scenes), the endless dive with its lives carry and
out-of-lives panel, a local ACCOUNT screen that saves progress behind a custom password, the aquarium builder with its full palette, dive mode, chill toggle,
LABYRINTH MODE with its seeded wreck course and hand-placed wall, support, and tentacle
burster pieces, and saved
layouts, and co-op
two-creature control, the MUTATORS screen with handicap scaling, the BOSS RUSH gauntlet
over all five horror bosses, the RECORDS board with per-mode best times and scores (plus a TAG
LEADERBOARD of best taggers and slipperiest runners, and pickable original tag-fish costumes — CHAIN-FIN, CRIMSON MANE, TOPKNOT, FALLEN ANGEL, and more — plus colors), and the
PLAYTOY EXPLORATION toy-liner tank (the ANCHOR-PACK with its three anchor heads, typed
gates, an anchor that bounces off hull walls, living plush toys, a persistent lore-paper
INVENTORY, and the EEL TOY chase that storms the last hold (PlayToy's giant plush eel with
ripped-out button eyes and a torn-off-mouth grin) — stun it on the live circuit or
drop cargo to stall it), the MUTANT HORRORS submenu (ten original flesh-horror tanks — THE
GRAFT, THE BROODMOTHER, THE SPINE, THE EYESWARM, THE MOULT, THE PUPIL, THE MUTAGEN, THE
HARVEST, THE SOMATIC, and THE TERATOMA — each with its own grotesque monster and gimmick),
the three new playable-creature tanks (MANTA RAY GLIDE, a flap-to-glide ring run; CUTTLEFISH
CAMO, a camouflage stealth dive where the cuttlefish grabs sea slugs with its feeding
tentacles while turtles cross the brightest blue water; and HERMIT CRAB HOLD, a shell-swapping
seabed crawl past urchins), four new original horror-adjacent tanks (THE LIGHTHOUSE, a
shadow-stealth tower climb under a sweeping beam; THE PRESSURE, a vent-to-vent depth descent;
THE CLEANER STATION, a clean-the-clients symbiosis run past parasites and a lurker; and THE
MIGRATION, a stay-in-the-school current ride), the TWILIGHT TANK (a glow-stealth mesopelagic swim where a HATCHETFISH baits a STOPLIGHT LOOSEJAW with bioluminescent decoys), the HAGFISH BLOOM (a scent-stealth swim where a gray CARIDEAN SHRIMP hides its fear-scent from a blind hagfish knot and washes in clean currents), the OARFISH (a minimalist crossing where you keep a colossal ribbon's lateral line calm), the WHALE FALL (a scavenger stealth run picking a carcass clean past a circling sixgill shark), the GOBLIN DEEP (a pitch-black hunt where you play the STOPLIGHT LOOSEJAW, eating shrimp to charge a stoplight meter you toggle with E to cast a red ray that reveals deep-sea squid, while a slow GOBLIN SHARK shoots its jaws out at short range), and six real-fish tanks — the ARCHER'S MANGROVE (spit water jets as an archerfish), the THRESHER'S LAGOON (dodge a thresher shark's whipping tail as a sardine), the SAWFISH FLATS (sweep a toothed saw through the sand past a bull shark), the TIDE-POOL WALKER (a mudskipper that hops onto the mud and dives back to shake a crab), the FROGFISH GARDEN (camouflage and lure prey past a green moray), and the SUNFISH DRIFT (a sinking ocean sunfish that surfaces for air between jellyfish and a sea lion), and the EVOLUTION TANK (pick a depth region and a real evolution lineage — cookiecutter shark to ray to shark, copepod to krill to shrimp, jelly to octopus to squid, plankton to hatchetfish to loosejaw to dragonfish — and eat your way up it while a predator stalks you),
and CUTE MODE (blush and floating hearts on every creature, a
blinking big-eyed cartoon face on every enemy, a soft
pink grade, and pastel big-eyed scare cards that replace the horror tanks' jump scares), and
the wider playable-creature roster (the DOLPHIN, SEA TURTLE, and CUTTLEFISH join as pickable divers), the THE POD dolphin hide-and-seek minigame, REEF RUSH — ENDLESS with boss waves, the SPRING/SUMMER seasons and their BLOSSOM DRIFT/SUNSET SURF games, the COLORBLIND HAZARDS switch, aura stacking, the coral-decorated AQUARIUM, PlayToy's BUILD-A-TOY, the DEAD CALM pistol-shrimp platformer (a giant claw, popping cavitation bubbles, a mutagen that traps you, and a giant eyeless moray that hunts splashes), the WEEKLY CHALLENGE, and PLAYPASS 10/11 (the CUTTLEFISH PACK and DEEP CORAL), the seasonal modes (CHRISTMAS/HALLOWEEN/NEW YEAR/SPRING/SUMMER with their own themed
scores and a NOW PLAYING label, themed menu particles, seasonal enemy hats, free festive
cosmetics and buddies, MERRY CHRISTMAS / HAPPY HALLOWEEN / HAPPY NEW YEAR theatre
trailers, and mode-exclusive minigames — Christmas: WRAP THE PRESENTS, SANTA'S NET; Halloween:
JACK-O'-LANTERN HUNT, SPECTRE SWEEP; New Year: MIDNIGHT FIREWORKS, CONFETTI RUSH — on a
scrollable minigame list), 8-BIT MODE
(a 256×144 pixelated render with chiptune audio), MEME MODE (all-original comic pop-up words,
speed lines and goofy captions over every screen), MOBILITE MODE (large on-screen W/A/S/D, SPACE, E and ESC buttons — plus a full keyboard for chat and tag names — that disables 3D, first person, 8-bit and the course builder), and REEF RUSH (an
original rhythm-runner with original hazards — seaweed/shell spikes on the floor and ceiling,
stackable floor/ceiling rocks, standable floating ledges, runnable slopes, pearls, air-boosting
pressure bubbles, gravity bubbles and gravity bubble pads, and thrust bubble jump pads on the
floor and ceiling — plus transformation portals that switch you into eight
swimmer modes (including a fish portal that turns you back, a swing nautilus that dies on contact, and a charge-jump mantis shrimp), playable on original levels with an end cutscene and skin
unlocks, on a course built from your own song, or you can design one by hand in the course
builder with its scrollable item list), and the TRACK BUILDER (a stretchable
four-track DRUMS/BASS/SYNTH/PIANO tone-block sequencer on horizontal lines, playable and
editable as MY TRACK from the track player) — so code and build regressions surface immediately. The artifact
is a single HTML file with no external requests and can be opened from `file://`.
