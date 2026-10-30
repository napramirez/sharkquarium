# Changelog

Notable changes to Sharkquarium, grouped into the contiguous days the work landed and
split into **game features** (player-facing content like tanks, creatures, modes,
screens, cosmetics, and progression) and **game systems** (the engine, rendering,
persistence, tuning frameworks, tooling, tests, and docs that support them). Each section
names the commits that carry the work.

## October 30, 2026 (latest)

Commits `fb34c5b` (collapsing ceiling stubs), `d21de53` (two-beat ending), `2845aea`
(karambit aura), `305ee15` (shop costumes), `760f030` (shadowed tunnel planks), `6dc0aeb`
(trench gaps), and `1f07537` and `7a18b65` (docs).

### Game features

- **Collapsing ceiling stubs** — ramming a cracked support now breaks the ceiling loose
  above the tentacle tangle: the closest hanging ceiling stub is torn out of the course
  (opening the gap it braced) and tumbles down onto the frozen tangle, bursting into dust,
  splinters, deep-red sucker sparks, and spinning `BreachChunk`s where it lands, while the
  collapse site keeps its pitch-black tangle (`crushFades`/`drawTangleFade`) for
  `collapseCrushFade` seconds and eases it out; when no stub is close, stub-sized planks
  drop in its place.
- **Two-beat ending cutscene** — the MEGASQUID finale now cuts in two: the first beat
  collapses the wreck around the entangled boss as the seven survivors race clear, then a
  distance beat puts the survivors in the foreground looking back at the liner perched on
  a rock ledge, which tips off the rim and sinks into the trench with the MEGASQUID and
  its glowing eye, fading into the dark.
- **Costumes** — a new COSTUMES row in the shop turns a diver into a dish: SHARK FIN
  DISH, SAMBAL STINGRAY, GRILLED SQUID, and PRAWN CRACKERS, each a whole-body food drawn
  over the creature in every tank, the menu, the cutscenes, and the shop preview, with its
  own `costume` equip slot and per-player `costume2`.
- **Karambit aura** — the KARAMBIT AURA's short, curved blades now read the equipped
  color: a silver blade with a gold loop on NATURAL, a pure-red blade and loop on RED, and
  a pure-red-to-black pulsing blade on SHADOW, over a thicker black handle.
- **Shadowed tunnel openings** — the labyrinth's hull tunnels and the aquarium's
  holed-wall and seeded openings are filled with the wall's plank grain a shade darker
  instead of a flat black void, so they read as shadowed wood; the diver still swims
  straight through.
- **TRENCH DIVE** — its ice gaps now stay within a diver's reach (`maxGapShift`), so the
  run is always threadable rather than a random dead end.

### Game systems

- **Tests and docs** — the smoke suite grew the ceiling-stub, ending-beat, costume, and
  trench-gap checks (about 14k animation frames), and the docs were kept in sync.

## October 25–26, 2026

Commits `fc9f6cd` and `99bf87a` (Oct 25) and `06f4603` (Oct 26); `ce8cf4f` (Oct 25)
created this changelog.

### Game features

- **LABYRINTH** — a seven-part shipwreck escape for one or two divers with part and
  per-player creature pickers, saved-part resume, a four-second tentacle head start, an
  on-screen joystick, ground and wall ambushes, ram-to-break supports, grab-clump
  pickups, and the MEGASQUID ending cutscene plus its own trailer.
- **Labyrinth rebalance** — a gentler wreck at every part: a slower tentacle tangle (100
  px/s) with a tighter 66% speed cap on the slowest diver, fewer extra sections, arms,
  and ambushes per part, longer ambush warning windows, slower ceiling chunks, more
  tunnels to hide in, a 360 px checkpoint mercy push, seven grabs, grab clumps arriving
  more often with four floating at once, and support rams that restart the tangle at
  the start of the part — never forward, and on every difficulty.
- **Pets Tank (PLAYPASS 3)** — the playerless feeding tank with snack and despawn-lure
  buttons, hungry swarms, saved progress, and cross-level enemy waves that include
  morays.
- **Pets tank play** — moods and tastes (favorite critters fill a pet completely and pop
  hearts), click-to-trick spins and rolls that shed coin bubbles, a TOY button whose
  bouncing toys pets boop around, a PHOTO button that saves persistent postcards, and a
  MEALS button that trades sea coins for snack packs.
- **Aquarium Builder (PLAYPASS 9)** — a twenty-two-entry palette of decor, pets,
  enemies, and habitats; CHILL mode; DIVE AS for all seven creatures; and a saved
  layout.
- **Aquarium labyrinth mode** — a LABYRINTH MODE row in the aquarium builder raises a
  seeded wreck course (gate walls with lane gaps and hull tunnels, stubs, hanging cracked
  supports, floor cracks, and ceiling beams) that persists, regenerates from its seed,
  and is solid to the DIVE AS diver; the mode also adds nine hand-placed wreck pieces to
  the palette (walls, rising walls, holed walls, stubs, a cracked support, and TENTACLE
  CRACK/BEAM bursters that spear out, fling planks, and knock the diver back) and
  ceiling ambushes for the labyrinth itself, whose tentacles spear straight down from the
  planks.
- **Auras** — the aura slot arrives with the removable EEL AURA trinket and eight coin
  auras: BUBBLE, NEON, STINGRAY, TRIDENT, KARAMBIT, SHARK, SWORD, and OCTOPUS.
- **Plushies, trails, and buddies** — PLAYPASS 5's eleven ragdoll plushies and the RGB
  neon jacket tailored to every creature, PLAYPASS 7's five swim trails, and PLAYPASS 8's
  twenty-one dive buddies covering every playable creature and enemy — with the seven
  playable-creature buddies wearing their exact silhouettes and colors, and the BABY
  MORAY, MINI DART EEL, and MINI VOLT EEL matching the tank eels.
- **MINI MEGASQUID** — a DIVE BUDDY for PLAYPASS 8: the labyrinth boss shrunk to buddy
  size, arms and long tentacles waving as it trails the diver with a periodically
  blinking glowing yellow eye, drawn through the same shared megasquid shapes as the
  ending and the arrival cutscene, and fully opaque like the boss itself.
- **2P wardrobe** — a PLAYER row in the shop dresses each diver separately: one can wear
  SUNSET ORANGE while the other wears RED, and colors, trinkets, trails, buddies, and
  auras all keep a per-player slot (`skin2`, `head2`, …) while purchases stay shared; the
  P2 set defaults to P1's and follows the second diver into co-op dives, races, dodgeball,
  and the labyrinth.
- **Lore codex** — a LORE entry on the main menu opens a five-section codex (the wreck,
  the nine tanks, the seven divers, the thirteen hazards, and the minigames) with named
  story entries for every character, level, and mode, browsed with section tabs and a
  windowed entry list.
- **Cutscene theatre** — the CUTSCENE THEATRE that replays any cutscene on demand, its
  SHARKQUARIUM: THE MOVIE reel (sixteen shots touring all nine tank gameplay sets and the
  minigames, closing on THE END) and SHOP TRAILER reel (nine shots cycling the colors,
  trinkets, trails, buddies, and auras across a seven-creature lineup), and the nested
  TANK TRAILERS and MINIGAME TRAILERS pages.
- **Wreck arrival** — the labyrinth opens on a cutscene after the diver picker: all seven
  playable creatures swim in to the sunken liner together, then the MEGASQUID rises out
  of the dark behind the wreck with its glowing yellow eye tracking the pack and a deep
  pressure roar, and the divers recoil a beat before the chase begins. Skippable with
  ENTER and replayable from the cutscene theatre's WRECK ARRIVAL row.
- **Spear ambushes** — labyrinth floor cracks and wall bursts now break open with a
  dust-ring breach flash, flinging spinning chunks of planking (`BreachChunk` debris with
  gravity and a short fade), and snap their tentacles out as straight spears in a tenth
  of a second with an eruption thwip and screen-shake kick per tentacle; a crack's spears
  ripple out a small
  beat apart (`burstStagger`) and then every tip curls together to grab (`curlGrow`),
  while the pack arms keep their usual writhe. A third ambush kind hides in the ceiling
  planks of deeper sections, spearing straight down, and every lance now holds straight
  `burstLance` (0.45 s) longer — floor, wall, ceiling, and the aquarium's — before the
  synchronized curl hooks.
- **Ceiling stalkers** — the labyrinth's ceiling ambushes now fire the moment a diver is
  under the seam at any depth, lean and stretch after the nearest diver frame by frame
  (still out-reaching the floor cracks), and stop at full stretch once the diver
  slips out of reach, wearing the MEGASQUID's feeding tentacle — a thin rope-width
  tentacle in the boss's deep red with its suckers, ending in a big diamond feeding pad
  studded with suckers — and the MEGASQUID itself renders fully opaque; the aquarium's
  TENTACLE BEAM follows the same rules.
- **REEF CLEANUP timer removed** — the cleanup minigame runs with no clock at all: the
  `RECYCLED n/8` counter stands alone and the round ends when the target is recycled.
- **REEF CLEANUP morays** — the floor holes now peek out smoothly, strike a bite, and
  retreat back in (`peek`/`bite`/`retreat` rise cycle) with their long `paintMorayTrail`
  bodies gliding out of the hole behind the head, and wear the stingray tank's moray
  colors, brown through spotted yellow.
- **Paid minigames** — six new arcade games gated by sea-coin tickets charged on every
  entry from the MINIGAMES menu: PUFFER BALL (2P or vs CPU, first to three goals), SCHOOL
  ROUNDUP (herd fleeing schools into the net), JELLY ASCENT (pulse-bounce up a ring
  shaft), STEALTH DIVE (slip past seal vision cones), REEF CLEANUP (nudge wreckage past
  morays into the recycle net), and TRENCH DIVE (thread ice on a timed descent), all
  sharing a common minigame scaffold and paying their usual finish/win coins.

### Game systems

- **Engine additions** — the plushie, trail, and companion rendering systems, the aura
  ring renderer, `resolveCircleRect` collision, and the theatre/trailer scaffolding.
- **Performance** — cached tentacle spine frames, batched sucker paths, and off-screen
  culling for the labyrinth tangle.
- **Persistence** — the shop shape with legacy accessory migration, plus saved pets,
  aquarium, and labyrinth progress and lifetime stats counters.
- **Tuning frameworks** — settings-driven difficulty extended across the minigames, the
  pets tank, and the labyrinth.
- **Tests and docs** — the smoke suite extended to the labyrinth, theatre, shop,
  cosmetics, minigames, and pets tank, and the docs kept in sync.

## October 23, 2026

Commit `7c7d0ea`.

### Game features

- **Shop and economy** — sea coins with a welcome bank, difficulty-scaled payouts and
  equipped-color bonuses; thirteen colors including the SHADOW and RAINBOW specials;
  coin trinkets; and nine PLAYPASSES at 1200 coins each.
- **Minigames** — the two-player bubble race and its 1P chase, TAG with named players
  and five CPU swimmers, and Pufferfish Dodgeball with three lives and no clock, all
  paying sea coins and counting wins.
- **Trinkets and colors** — separate HEAD and BODY trinket slots, coin trinkets
  including the stingray hat, PLAYPASS 2's MONSOON/EMBER colors and pirate/propeller
  trinkets, and the SHADOW white eyes on the shrimp, stingray, and nautilus.
- **Kelp Forest and reef content** — the kelp crab player and stun-the-octopus boss,
  reef corals and boulders, the purely cosmetic colorful school, and the tank chain
  rework.
- **Cutscenes and trailers** — the intro splash, per-tank descents, the GAME TRAILER, and
  the all-tank gameplay gauntlet.
- **Music and the track player** — per-tank themes, the labyrinth dread theme, and a
  TRACK PLAYER that lists all eleven tracks and holds one across scene changes.
- **Creature and hazard reworks** — moray eels named and given dart-eel-style faces,
  player-near jaw gapes, a tail-slide entry, and a bite chomp; dart eels reworked into
  ribbon bodies.
- **Difficulty and controls** — APOCALYPTIC WIPEOUT difficulty and on-screen joystick
  steering.

### Game systems

- **Engine additions** — the music player's hold and routing model, the progress module
  for minigame rewards and counters, the skin and accessory rendering systems, and
  joystick input plumbing.
- **Tests** — the smoke suite extended to the shop, minigames, kelp forest, and
  cutscenes.

## October 18–19, 2026

Commits `efeca1a` and `516494c` (Oct 18) and `eb3895f` and `8e7032b` (Oct 19).

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
