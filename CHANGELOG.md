# Changelog

Notable changes to Sharkquarium, grouped by the date the work landed and split into
**game features** (player-facing content like tanks, creatures, modes, screens,
cosmetics, and progression) and **game systems** (the engine, rendering, persistence,
tuning frameworks, tooling, tests, and docs that support them). Each section names the
commits that carry the work.

## October 23–25, 2026 (latest)

Commits `7c7d0ea` (Oct 23), `fc9f6cd` and `99bf87a` (Oct 25).

### Game features

- **Shop and economy** — sea coins with a welcome bank, difficulty-scaled payouts and
  equipped-color bonuses; thirteen colors including the SHADOW and RAINBOW specials;
  coin trinkets; and nine PLAYPASSES at 1200 coins each.
- **Minigames** — the two-player bubble race and its 1P chase, TAG with named players
  and five CPU swimmers, and Pufferfish Dodgeball with three lives and no clock, all
  paying sea coins and counting wins.
- **LABYRINTH** — a seven-part shipwreck escape for one or two divers with part and
  per-player creature pickers, saved-part resume, a four-second tentacle head start, an
  on-screen joystick, ground and wall ambushes, ram-to-break supports, grab-clump
  pickups, and the MEGASQUID ending cutscene plus its own trailer.
- **Pets Tank (PLAYPASS 3)** — the playerless feeding tank with snack and despawn-lure
  buttons, hungry swarms, saved progress, and cross-level enemy waves that include
  morays.
- **Aquarium Builder (PLAYPASS 9)** — a twenty-two-entry palette of decor, pets,
  enemies, and habitats; CHILL mode; DIVE AS for all seven creatures; and a saved
  layout.
- **Cosmetics** — PLAYPASS 2's MONSOON/EMBER colors and pirate/propeller trinkets,
  PLAYPASS 5's eleven ragdoll plushies, RGB neon jacket, and SHADOW/RAINBOW eel auras,
  PLAYPASS 7's five swim trails, and PLAYPASS 8's twenty companions covering every
  playable creature and enemy; separate HEAD and BODY trinket slots; new coin trinkets
  including the stingray hat; and the SHADOW white eyes on the shrimp, stingray, and
  nautilus.
- **Kelp Forest and reef content** — the kelp crab player and stun-the-octopus boss,
  reef corals and boulders, the purely cosmetic colorful school, and the tank chain
  rework.
- **Cutscenes and the theatre** — the intro splash, per-tank descents, the dawn
  cutscene, the GAME TRAILER, the all-tank gameplay gauntlet, nested TANK TRAILERS and
  MINIGAME TRAILERS pages, and the CUTSCENE THEATRE that replays any of them on demand.
- **Music and the track player** — per-tank themes, the labyrinth dread theme, and a
  TRACK PLAYER that lists all eleven tracks and holds one across scene changes.
- **Creature and hazard reworks** — moray eels named and given dart-eel-style faces,
  player-near jaw gapes, a tail-slide entry, and a bite chomp; dart eels reworked into
  ribbon bodies.
- **Difficulty and controls** — APOCALYPTIC WIPEOUT difficulty and on-screen joystick
  steering.

### Game systems

- **Engine additions** — the music player's hold and routing model, the progress module
  for minigame rewards and counters, the skin, accessory, plushie, trail, and companion
  rendering systems, `resolveCircleRect` collision, and joystick input plumbing.
- **Performance** — cached tentacle spine frames, batched sucker paths, and off-screen
  culling for the labyrinth tangle.
- **Persistence** — the shop shape with legacy accessory migration, plus saved pets,
  aquarium, and labyrinth progress and lifetime stats counters.
- **Tuning frameworks** — settings-driven difficulty extended across the minigames, the
  pets tank, and the labyrinth.
- **Tests and docs** — the smoke suite extended to every tank, screen, minigame,
  labyrinth, theatre, shop, and cosmetic (about 11.4k animation frames), and the docs
  kept in sync.

## October 18–20, 2026

Commits `efeca1a` and `516494c` (Oct 18), `eb3895f` and `8e7032b` (Oct 19). No changes
landed on October 20 itself.

### Game features

- **Core reef loop** — the shark player collecting bubbles and rare golden bubbles past
  jellyfish hazards, with a navigable menu, a game-over screen, and a state-driven HUD.
- **EMPTY TANK test mode** — keeps every screen usable with no game content.
- **Five-tank gauntlet** — the stingray, deep sea, arctic, jelly miniboss, and freshwater
  tanks with their players, hazards, bonuses, and hiding spots, plus current and updraft
  zones in the reef.
- **Dawn cutscene** — the sunrise that closes a completed run.
- **Tank select and SETTINGS** — co-op toggle, EASY/NORMAL/HARD difficulty, master
  volume, and an SFX switch, all persisted.
- **Two-player co-op** — per-player creatures and bindings with shared score, timer, and
  teleports.
- **Miniboss music** — step-sequenced themes that pause with gameplay.

### Game systems

- **Engine** — fixed-timestep loop, scene registry and transitions, input bindings,
  WebAudio synth and audio bus, render helpers, particles, storage wrapper, entity and
  scene bases, and config-driven tuning.
- **UI systems** — the standalone HUD, the reusable SelectList, and the boot scene.
- **Artifact pipeline** — the zero-dependency bundler, ASI-safe minifier, and
  `scripts/build.mjs` emitting the single-file `dist/index.html`.
- **Workflow tooling** — the dev server and the headless smoke test that drives the
  minified artifact.
- **CI and deployment** — a GitHub Actions workflow that builds, smoke-tests on Node 22,
  and deploys `dist/` to Pages.
- **Documentation structure** — the `README.md` / `FEATURES.md` / `GAME_DESIGN.md` split
  with a cross-linked documentation map.
- **Difficulty rules** — settings-driven scaling across spawns, enemy speeds, penalties,
  grace, clocks, and pack thresholds.
- **Persistence basics** — the storage wrapper plus saved settings, co-op, and
  difficulty.
