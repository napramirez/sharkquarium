# Sharkquarium — Technical Design

Implementation details for the scaffold: architecture, engine APIs, build pipeline, and
workflow. Game-specific requirements — lore, navigation, entities, scoring, art and
audio direction — live in `FEATURES.md`. Keep both files in sync when either changes.

## 1. Architecture

Layers:

| Path                     | Responsibility                                        |
| ------------------------ | ----------------------------------------------------- |
| `src/engine/`            | Reusable engine: loop, scenes, input, audio, rendering, UI widgets |
| `src/ui/`                | Game-facing UI components (HUD, pets-tank buttons)    |
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
rendered onto the creatures, routed through `plushie.js` for the ragdoll plushie pack),
`trail.js` (per-entity swim wakes) and `companion.js` (per-entity follower pals),
`progress.js` (minigame rewards and counters), `math.js`, `collision.js` (circle
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
- `ShopScene` (`shop`) sells character colors, coin trinkets, and nine playpasses
  (1200 each, browsed with Left/Right). Its menu rows are COLOR, CREATURE, HEAD, BODY,
  TRAIL, COMPANION, PLAYPASS, and BACK: HEAD/BODY split `ACCESSORIES` by their `slot`
  tag into two independent equip slots (a hat combines with a plushie), while TRAIL and
  COMPANION browse `TRAILS`/`COMPANIONS`. Pass 1 unlocks minigames, pass 2 grants the
  pass-exclusive MONSOON/EMBER colors and PIRATE HAT/PROPELLER CAP trinkets (ownership
  checks union `passGranted()` over `PASSES`, so granted items equip for free and cannot
  be coin-bought), pass 3 unlocks the pets tank, pass 4 unlocks the endless dive, pass 5
  grants the cosmetics bundle — eleven ragdoll plushies, the hue-cycling NEON JACKET,
  and the SHADOW/RAINBOW eel auras (`setEelAura()` feeds `skin.js` from the pass list on
  every scene enter and on purchase) — pass 6
  unlocks the rare pets and trained fetching, pass 7 grants the five TRAILS, pass 8
  grants the twenty COMPANIONS (the five favourites plus mini versions of every playable
  creature and every enemy), and pass 9 unlocks the aquarium builder.
  `drawAccessory(ctx, radius, time, frame)` now carries an optional render frame
  (`{ entity, heading, flip }`) so `plushie.js` can read each wearer's velocity: every
  plushie keeps its appendage chains in a `WeakMap` of spring/damper joints
  (`STIFFNESS` 55, `DAMPING` 5.5) whose targets trail opposite `vx`/`vy` (mapped into the
  entity's rotated or mirrored render space), straighten under speed, and sway at rest,
  with per-creature specs for the seven divers, the moray, and the three rare pets.
  `trail.js` samples each swimmer's recent positions in a per-entity `WeakMap` and draws
  the five wakes; `companion.js` eases a floating pal behind the entity along its
  velocity or heading. It previews each of the seven
  playable creatures in the selected
  color (wearing both equipped slots, the equipped trail, and the companion), and persists
  `{ owned, skin, passes, accessories, trails, companions, head, back, trail, companion }`
  under `SHOP_KEY` (legacy `accessory` saves migrate into their slot on entry) and the
  bank under
  `COINS_KEY`. `MinigamesScene` (`minigames`) lists the unlocked playpass content and
  starts the two-player race with `{ race: true }`; `PlayScene` then forces co-op but
  keeps the selected difficulty rules (the race clock scales with `timeScale`), tracks
  per-player bubble counts (`playerBubbles`), skips the
  tank chain and best/stat/coin writes, and hands the race results to the game over
  panel. `{ race: true, solo: true }` runs the one-shark race: the win rule becomes the
  `RACE.soloTarget` threshold and the results panel shows a single tally. The tag and
  dodgeball scenes take `{ solo: true }` too — one name field and one player swimmer
  (tag) or one shark life pool (dodgeball), with solo win rules
  (`TAG` CPU-tagger rule, `PUFFER.soloSurvive` seconds). CPU taggers move at
  `TAG.taggerSlow` (72%) so the chase stays escapable. All three games read
  `SETTINGS_KEY` into `this.rules`: tag bakes `enemySpeed` into every swimmer's pace at
  construction — players included, so relative speeds stay fair at every difficulty —
  and dodgeball scales puffer speed by `enemySpeed` (capped by `PUFFER.speedCeiling`
  against stacked difficulty and overtime), spawn timers by `spawnInterval`, and
  compresses its endless ramp by `rampScale`. The active color is applied at render time via `skin.js` — entities call
  `playerColor(slot, fallback)`, so specials like SHADOW (pulsing red accents, plus
  white dot eyes on the shrimp, stingray, and nautilus via `shadowEyeColor()`) and
  RAINBOW (hue cycling) work across every creature.
- `TrackPlayerScene` (`tracks`, opened from SETTINGS) lists `TRACK_LIBRARY` from
  `src/assets/tracks.js` and plays or stops any tank theme through the shared
  `MusicPlayer`; playing sets `music.hold`, so the chosen theme keeps playing after the
  player is left, until it is stopped there or a dive takes over.
- `TheatreScene` (`theatre`, opened from SETTINGS) lists every `CUTSCENES` entry — the
  game trailer, the
  intro splash, the eight `TANK_INTROS` descents, the dawn cutscene, the labyrinth
  trailer, and the labyrinth
  finale — and launches each with a `from: 'theatre'` param (`{ trailer: true }` or
  `{ ending: true }` for the labyrinth) so `IntroScene`, `TeleportScene`, `DawnScene`, and the labyrinth's trailer/ending
  phases all return to the theatre instead of their normal destinations, with no minigame
  rewards recorded. An `ALL-TANK GAMEPLAY` row launches the gauntlet trailer directly, and
  the `TANK TRAILERS` and `MINIGAME TRAILERS` rows swap the list for nested pages
  (`createMenu('main' | 'tanks' | 'minigames')`) of `TANK_TRAILER_LIST` /
  `MINIGAME_TRAILER_LIST` rows — launched as `trailer` with `{ tank }` or `{ minigame }` —
  with `BACK`/Esc stepping out to the cutscene list while the main page keeps its denser
  layout for seventeen rows.
- `TrailerScene` (`trailer`, the game trailer) is a self-contained nine-shot montage:
  `SHOTS` pairs a duration, title card, and palette per shot (`title`, `reef`, `deep`,
  `arctic`, `bosses`, `minigames`, `dress`, `labyrinth`, `finale`), `buildShot()` casts
  real entities (creatures, hazards, corals, sardine and color schools, kelp forest,
  pufferfish volleys, and labyrinth tentacles/morays), and the scene adds rising bubbles,
  per-shot push-in zoom, hard-cut flashes, letterbox bars, stings, and a `dress` shot
  that cycles every `SKINS` color and `ACCESSORIES` trinket live. Enter/Esc skips back to
  the theatre and the held music theme is untouched. `enter({ tank })` switches to tank
  mode: `tankShots()` builds a three-card cut-down (tank card, feature card, dive-now
  card) and `buildTankShot(view, tank)` stages that tank's real cast — reef corals with
  jelly lines, the moray archway and a tinted freshwater ray, angler ledges with the crab
  and squid, ice perches with diving seals, kelp forest with the octopus, minnow clouds
  with the turtle, whale bones with the chaser shark and dart eels,
  logs/piranha/electric-eel freshwater sets, and the pets tank menagerie — under
  `PALETTES[tank]`. `enter({ minigame })` gives the four minigames the same three-card
  treatment with `buildMinigameShot(view)`: racing sharks and rising `GoldenBubble`s for
  competitions, a live `TagSwimmer` pack fleeing its tagger for tag, bouncing
  `Pufferfish` volleys over idle sharks for dodgeball, and the escalading
  `addLabyrinthSet()` moray/tentacle/squid cast for labyrinth. `enter({ gauntlet: true })`
  runs the long-form ALL-TANK GAMEPLAY trailer — `gauntletShots()` books a title card,
  nine 3.4 s gameplay shots (one per tank in chain order, alternating feature and threat
  casts through `buildTankShot(view, shot.tank)`), and a finale card; `isCard()` keeps
  those gameplay shots out of the card styling so the cut plays as continuous footage.
- `DodgeballScene` (`dodgeball`) is the third minigame: two shark players with three
  lives each dodge `Pufferfish` that telegraph at an arena edge (charge state with an
  inflation grow and warning ring) before flying across on wobbling lines. Hits pop the
  fish, cost a life, knock the player back, and grant blinking invulnerability; there is
  no clock — the first player to lose all three lives ends the round (`winner` index,
  `-1` on a double KO). `difficulty()` derives the endless curve from `elapsed`: spawn,
  speed, and telegraph scales plus aimed-shot and double-volley chances all tighten past
  the ramp, with hard ceilings so it stays readable. It renders the equipped skin and
  accessory on both players.
- `LabyrinthScene` (`labyrinth`) is the fourth minigame: a horizontal shipwreck escape
  where one or two `Shark` players (`maxX: worldLength` widens the shared world bounds)
  outrun a tangle of octopus tentacles. Entry starts in `phase: 'select'`: a `SelectList`
  opens with a `PART: n/7` row (action `part`; `cyclePart()` drops into any stretch,
  defaulting to `savedPart` from `LABYRINTH_KEY` and never writing progress), then
  cycles the seven `DIVE_CREATURES` classes (`Shark`, `Stingray`, `Squid`,
  `ArcticShrimp`, `KelpCrab`, `MoonJelly`, and a `Nautilus` built with `vertical: true`
  so it is not lane-locked) with live previews. Solo gets one `CREATURE` row; co-op gets
  separate `P1 CREATURE`/`P2 CREATURE` rows (actions `creature1`/`creature2`) with one
  preview each, so both divers pick independently. `saveProgress()` stores the progress
  part and both picks under `LABYRINTH_KEY` (`{ part, creature, creature2 }`); confirming
  calls `resetRound()`, which builds the course and
  spawns each player's picked class (`maxX: worldLength` bounds on all seven). A start
  matching the saved part shows the `RESUMING` banner; a hand-picked one does not.
  `finish()` clears the save on a full escape and otherwise stores the highest part
  reached (when part > 1) so the next `enter()` resumes there. `buildCourse()` lays five
  sections of wooden
  gate walls and floor/ceiling stubs (`resolveCircleRect` keeps players out of them),
  carves a hull tunnel through every gate tall enough to hold one
  (`tunnelHeight`/`tunnelMargin`) — so the tightest passages can always be swum straight
  through — sprinkles hull ribs,
  portholes, barrels, and weeds, and plants a checkpoint mast at every section start. The
  tangle advances each frame at `LABYRINTH.wallSpeed` scaled by course progress and the
  difficulty `enemySpeed` under a `speedCeiling`, after a `LABYRINTH.wallDelay` head start
  during which the wall is frozen, unrendered, and cannot grab (a pulsing
  `TENTACLES IN n` countdown ticks down in the HUD); arming a checkpoint or respawning
  drags
  it back to `checkpoint.x - mercyPush`, and the consumed wreck behind it fades to
  pitch black across `LABYRINTH.darkFade` px. The front itself is a pack of 14 decorative
  `Tentacle` instances (`pack: true`, scaled lengths and widths, sine writhe), so the chase
  reads as continuous octopus arms; the seven gameplay grabbers ride in the same tangle
  and lunge when the nearest live player is within `grabRange`. Every arm renders as a
  tapered octopus arm with a shaded top, two staggered rows of suckers on its underside,
  and a tip that curls harder as it reaches (`curlStart`/`curlBase`/`curlGrab`). For
  performance each arm caches one spine frame per render and draws it as two ribbon
  fills, one ridge stroke, and two batched sucker paths, and the scene culls wall and
  crack arms as soon as they leave the screen. During play the HUD draws the shared
  on-screen joystick (`drawJoystick`/`joystickState` from `src/engine/joystick.js`) in
  the bottom-right — the same drag model as the tanks, steering P1 — with per-player grab
  counts moved to the top corners to make room. The grab
  check samples the outer arm
  (0.7 / 0.85 / 1.0 of its length) so the hook catches what it visually touches. A
  wall or tentacle contact costs a grab: the player is held for `grabHold`, then respawns
  at their last checkpoint (or is out when grabs hit zero). Reaching `exitX` marks the
  player escaped; the round ends when nobody is still playing, and `recordMinigame(won)`
  pays the bonus only when every player escaped, and a full escape enters
  `phase: 'ending'`: `startEnding()` plays a skippable `LABYRINTH.endingDuration` cutscene
  where the wreck's squid becomes the MEGASQUID (`drawSquid` at scale 1.75, shared with
  the background watcher via `drawSquid`/`drawSquidEye`), tangled beams and tumbling
  debris fall with it, and all seven `DIVE_CREATURES` instances (`escapees`) swim clear;
  scripted impact/crumble/surface events fire bursts and tones, and Enter/Esc jumps
  ahead to the results panel. The run is a seven-part gauntlet:
  `resetRound()` builds part one, `checkResults()` calls `advancePart()` once every
  player has escaped the current part (and `finish()`es early if anyone is caught or
  after part `LABYRINTH.parts`), and `setupPart()` rebuilds the course, refills grabs,
  clears the per-part flags, and repositions the divers. `buildCourse()` scales with
  `this.part`: an extra section every `partSectionStep`, extra cracked mounds every
  `partCrackStep`, extra wall ambushes every `partWallBurstStep`, the tunnel margin grows
  `partTunnelMargin` per part (fewer shortcuts), and the wall speed gains `partSpeedRamp`
  per part under a cap that itself rises `partCeilingRamp` — then the cap is further
  pinned to `wallPlayerRatio` (72%) of the slowest player's `maxSpeed` (every player
  class reports its `maxSpeed`), stored as `this.wallCeiling` so slower creatures like
  the moon jelly can never be outrun. The picker builds the stingray with `burrow: false`
  (`Stingray` accepts a `burrow` option), so it cannot bury itself in the wreck deck and
  skip the wall with its 130 px/s crawl; supports break at `supportRamSpeed` (190 px/s).
  `setupPart()` adds an arm
  every `partGrabberStep`, shortens every ambush and ceiling warn window and cooldown by
  `partWarnScale`/`partCooldownScale` per part, and scales chunk fall speed by
  `partFallRamp`. PLAY AGAIN rebuilds part one on a fresh course.
  `crackSpots` mark cracked floor mounds (kept clear of floor-reaching
  walls) and `wallBurstSpots` mark wall faces (picked from `gateSpans` so bursts avoid
  tunnel openings); each runs one shared warn/burst/cooldown state machine
  (`updateAmbush`) — a live player within the ambush's trigger (x only for mounds, x and
  y for wall faces) makes it glow for its warn time, then the mound's `arms` (one arm per
  `crackArms`, fanned with anchor offsets and spread angles) or the wall's single arm
  erupts in burst mode (mounds upward at `angle: -PI/2`, walls sideways at 0/PI) and
  grabs through samples of its lower and outer arm (`burstDuration`/`burstGrabAfter` are
  shared). `ceilingSpots` mark cracked ceiling beams: `updateCeiling()` warns when a live
  player is directly beneath (`ceilingTriggerX`), then drops a `CeilingChunk` under
  gravity — a hit calls `stagger()`, knocking the player around and freezing control for
  `ceilingStun` seconds while the wall keeps coming. `updatePickups()` then keeps a fresh
  grab-chance clump (`makeClump()`, `grabPickupClumpMin`–`grabPickupClumpMax` packed
  within `grabPickupClumpSpread`) floating ahead of the pack (`grabPickupInterval`,
  capped at `grabPickupActive` clumps at once) in every part; `collectPickups()` turns
  each bubble into +1 grab (uncapped) with a `+1 GRAB` popup. A
  background squid drifts after the nearest swimmer with `squidFollow` and
  `squidParallax`, its glowing yellow eye tracking the watched player and blinking on
  the `squidBlinkMin`/`squidBlinkMax` cycle. The scene plays `LABYRINTH_TRACK` (a 138 BPM D-minor chase) with
  `music.hold` cleared on entry, and `exit()` restores the previously held theme so the
  menu family keeps its music after the wreck. The `{ trailer: true }` entry point skips
  the picker: `startTrailer()` resets the course, casts all seven `DIVE_CREATURES` as
  `trailerCrew`, and runs `TRAILER_SHOTS` — seven scripted shots (`start`, `wall`,
  `support`, `ambush`, `checkpoint`, `chase`, `escape`) with per-shot cameras, push-in
  zoom, hard-cut flashes, stings, letterboxing, and title cards in `updateTrailer()` /
  `renderTrailer()`; Enter/Esc or the final card returns to the theatre.
- The endless dive (`{ endless: true }`) skips `updateTimer()`, hides the HUD clock, and
  tracks `lives` (three by default, `ROUND.endlessLives`): `loseLife()` is called from
  every `bite()` and the reef-hazard contact, and the last life reuses
  `completionPayload()` into the standard game-over panel (titled `OUT OF LIVES`). The
  flag rides along the teleport payload so the whole gauntlet stays endless.
- `AquariumScene` (`aquarium`, PLAYPASS 9) is the decorator and dive tank: `ITEM`
  browses the twenty-two-entry `AQUARIUM.kinds` palette (coral, rock, weed, ice, sardines,
  `PET:<kind>` residents, `ENEMY:<kind>` residents, and the `ARCHWAY`/`LEDGES`
  habitats) with Left/Right; clicking the tank places the current kind with **no
  placement cap** (habitats are single-instance), with `UNDO` and `CLEAR ALL`; the
  layout persists under `AQUARIUM_KEY` after every change and reloads on entry, with
  the pet and enemy groups rebuilt from the saved items. Coral, rock, and weed snap to
  the floor; ice, sardines, pets, and enemies float where placed. `CHILL MODE: ON/OFF`
  is a persisted toggle (saved beside the items) that makes the dive peaceful: enemy
  updates still run but receive no targets, placed pets receive no threats, and bump
  collisions are skipped, so residents wander and nothing can touch the diver. `DIVE AS` cycles the
  seven playable creature classes (shark, stingray, squid, arctic shrimp, kelp crab,
  moon jelly, nautilus) with Left/Right and Enter switches to `phase: 'dive'`: the
  player is a normal player entity (solo controls, pointer steering) with no clock or
  scoring, placed pets flee placed enemies, and an enemy overlap only knocks the diver
  back (impulse, `invulnerable`, particle burst). The nautilus dive entry passes
  `vertical: true`, so it can swim up and down here even though its tank lane pins it
  (`freeVertical` skips the `autoScrollY` snap in `Nautilus.update`). Morays receive the
  real diver list as `Eel.update`'s fourth `nearby` argument, so their jaws still gape
  when the diver is close even though chill mode passes no chase targets, and a moray
  bump calls `Eel.bite()` — the same chomp (`biteGape` flare, `biteSnap` clamp) a
  stingray-tank bite plays. Esc surfaces to
  the workshop; a second Esc leaves for the menu. Pet residents are seeded with
  `drainScale: 0` so they never go hungry in the workshop.
- The pets tank is a PlayScene variant (`this.petsTank`) with **no player entities**
  (`this.players = []`): the standard spawners are off and feeding comes from pointer
  input — `POINTER_KEY` drops a rising `Bubble` snack, and `POINTER_SECONDARY` (right
  click, context menu suppressed in `Input`) drops a random `Snack` critter, or a
  `Lure` while any `petEnemies` are loose. The bottom-right `SNACK`/`LURE` buttons from
  `src/ui/petcontrols.js` do the same for touch, dropping at `PET_DROP` (tank centre);
  the joystick render is skipped here since there is no player to steer. Enemy waves pick
  three of the five hunter kinds (`jelly`, `turtle`, `puffer`, `angler`, and a `moray`
  built from `Eel` with `startHunt(null)` so it swims in its hunting state, tinted by a
  random `EEL_VARIANTS` palette). `Pet` entities
  cover every shop creature — plus three rare kinds with PLAYPASS 6, which also doubles
  snack credit —
  wander slowly with velocity-eased steering, `PETS.separation` personal space, and a
  `PETS.wallMargin` repulsion so they turn away from the walls, seek
  food, and flee enemies (the `scared` timer only re-arms while a threat is actually
  near, so fright fades and pets resume feeding); each pet carries `hunger` (rising at
  `PETS.hungerDrain`, scaled
  by `1 / grace`) and above `PETS.hungryThreshold` it swarms the widest-radius snack at
  the hungrier speed. Eaten `Snack` critters count as `meals` (bubbles only score),
  which load from `PETS_KEY` and save through `saveProgress()` — called after every
  snack, from `exit()`, and from `main.js` on `pagehide` / `beforeunload` / hidden tab —
  so progress always survives a restart.
  Enemies are random hazards pulled from other tanks (jellyfish, turtle, pufferfish,
  anglerfish) and arrive in waves: `spawnWave()` fires whenever `meals` reaches
  `nextWave` (every `PETS.waveEvery` = 20 snacks), shuffles the level pool, and spawns
  `PETS.waveSize` (3) distinct kinds with a `waveTimer` announcement; each has a
  lifetime. `lureEnemies()` pulls them within
  `PETS.lureRadius` toward a lure until the first one despawns (lured enemies are
  flagged and skip the hunt), and `huntPets()` chases the nearest pet at `PETS.enemyChase`
  with a per-enemy `biteCooldown` (chase speed and bite loss scale with the selected
  difficulty: `enemyChase × enemySpeed`, `biteLoss × penalty`), biting on contact and
  saving immediately. Puffer enemies get an infinite `petLife` and wall bounces (their
  `vx`/`vy` flip at the tank edges) so they never despawn on their own, while roaming
  kinds keep the 14 s lifetime. Meeting the goal resets `meals` and the saved tally to
  zero. `updateTimer()` is
  skipped for the tank, so its clock never ticks and the HUD hides the time bar. The
  10,000-meal goal
  completes through `completionPayload()` into the dawn cutscene with a custom line.
  The menu and tank select hide the entry unless PLAYPASS 3 is owned.
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
  auto-advances after 8 s. It starts `MENU_TRACK` with `hold` when nothing is playing,
  and `MenuScene` does the same — so the theme runs unbroken from the splash through the
  menu family until a dive takes over.
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
- `POINTER_KEY` covers the primary press; `POINTER_SECONDARY` fires on right clicks
  (the canvas context menu is suppressed), used by the Pets Tank's critter feeding.
- The on-screen joystick (`src/engine/joystick.js`) reuses the drag model: a press whose
  origin lands inside the bottom-right pad draws a knob and steers P1 with the drag
  vector; `hitJoystick`/`joystickState` own the geometry and the play scene renders it
  above the HUD.
- Window blur clears the held-key set to prevent stuck movement.

## 5. UI Components

- `Hud` (`src/ui/hud.js`): renderer driven by a state object
  `{ score, best, timeLeft, timeLimit, empty, coop, tank, eel, eelCharge, eelNeed,
  angler, seal, sealCharge, sealNeed, sunrise, turtle, minibossPoints, catfish, nautilus,
  pets, meals, hungry, endless, lives, depth, race, hidden }`,
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
- `AudioBus.setVolume(value)` scales the master bus (base gain 0.9) and
  `setSfxEnabled(flag)` mutes cues; `src/main.js` re-applies the persisted settings on
  startup.
- `MusicPlayer` (`src/engine/music.js`) step-sequences looping themes (the menu lullaby
  plus one per tank) from
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
  as `{ owned, skin, passes, accessories, trails, companions, head, back, trail,
  companion }` and the sea-coin bank under
  `COINS_KEY` (defaulting to the 500-coin welcome bank on first read); the aquarium
  layout persists under `AQUARIUM_KEY` as `{ items, chill }`; pets-tank
  feeding progress persists under `PETS_KEY` as `{ meals }`, written after every snack,
  when the scene exits, and when the page is hidden or unloaded; the labyrinth keeps its
  `{ part, creature, creature2 }` under `LABYRINTH_KEY`, resuming a saved part and
  clearing it on a full escape. Dive payouts multiply the difficulty scale
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
with score and timer carry-over, burrow crawling, bubble-gated moray hunts, moray pack
last-seen roaming, the retreat `entering` state that slides moray tails into their holes
(`EEL.enterSpeed`, the body clipped by `outsideDistance`), and bite penalties, the 250-point deep-sea teleport, crab sinking,
squid ledge hiding, anglerfish spawn spacing, separation, and losing the trail, the 40-bubble arctic teleport, plankton
drift and collection, the 15-plankton seal dive, sardine-school concealment, seal bite
penalties, the 30-plankton jelly teleport, minnow tangling, turtle body penalties, head
stuns, miniboss clearing, the freshwater chase (lane pinning, bubble rows, rock
burrowing, plant tangles, piranha stuns, catfish bites, the freshwater difficulty ramp,
electric eel shocks and burrow safety, the 150-bubble goal opening the dawn cutscene,
the nautilus chase (lane pinning, hole-free side steering, whale skeleton and darting eel
penalties, squid interception with paralysis, dodge-fed shark distraction, shark bites,
the depth ramp, and the 120-bubble goal opening the freshwater chase),
the menu theme carrying from the intro through the menu family, the endless dive (no
clock, lives pips, hit penalties, teleport carry, and the out-of-lives panel), the
aquarium builder (the twenty-two-item palette, pet/enemy/habitat placement, unlimited
placements, single-instance habitats, diving as every character, bump knockbacks, the
persisted chill toggle, moray jaw proximity, the moray bite chomp, and saved layouts), the tank
select with
co-op toggle, the settings switches, difficulty selector (through
APOCALYPTIC WIPEOUT), and
volume slider with persistence, co-op two-creature control, the empty tank clock
reaching game over, and the game over menu — failing on any runtime error. It also
covers the shop (coin banking with difficulty scaling, failed and successful purchases,
the SHADOW/RAINBOW specials persisting with the pass-gated eel aura rings, the ragdoll
plushie pack and RGB neon jacket, HEAD/BODY slot trinkets with legacy accessory
migration, the five trails and twenty companions, buying/wearing/removal per slot, and all
three
playpasses with their pass-granted cosmetics), the pets tank (playerless left/right-click
feeding with clicks and the on-screen snack/lure buttons, pet seeking and eating, the
scared-timer fade, hunger drains with hungry swarming, difficulty-scaled
enemy hunts and bite losses, three-enemy snack-milestone waves (including moray-eel
hunters, spawned in their hunting state, which gape near pets via `Eel.update`'s
`nearby` list and chomp through `Eel.bite()` when `huntPets()` lands a bite) that bite pets and drain
the tally, despawn lures with snack-level and game-exit progress saving, the tally reset
at the goal, and the 10,000-meal goal), the minigames menu, the
two-player competition race with per-player bubble credit and race results, the tag
minigame (name entry, distinct CPU names, random tagger, CPU random-target chasing,
tag transfers with the separation push, the flash, and the 60-second results), solo
variants of every game (the solo race target, solo tag with one name and six
swimmers, and solo dodgeball survival), difficulty-scaled minigame rules (the race
clock, the uniformly paced tag round, and capped puffer scaling), minigame
coin rewards and win/loss counters, the kelp forest chain (arctic plankton gate, kelp
stalks, the octopus patrol/lunge/head-stun with its bubble burst, and the 25-bubble goal
opening the jelly tank), the per-tank decor layers, the
pufferfish dodgeball knockout (telegraphs, life losses, invulnerability protection,
the endless difficulty ramp with aimed shots and capped scaling, and the no-timer
knockout ending), the labyrinth shipwreck escape (the part and per-player diver pickers with their persistence,
course generation, checkpoint arming
with wall mercy pushes, wall and tentacle grabs with respawns, co-op and solo outcomes,
part advancement and the seven-part full escape,
the multi-tentacle cracked-ground bursts, wall bursts, and ceiling chunks staggering
whoever stands beneath, `updatePickups()` seeding a fresh grab-chance clump ahead of
the pack every `grabPickupInterval` (cap `grabPickupActive` clumps at once, +1 grab per
bubble with popups, uncapped), the four-second tentacle head start with its countdown,
the slowest-diver wall cap, the stingray's burrow disabled on
the deck, the watching squid, the free-swimming nautilus, saved-part
resume and clear-on-win, the MEGASQUID ending cutscene, rewards, and its dread theme handing back
the held track), the cutscene theatre (every cutscene replaying and returning on demand,
including the GAME TRAILER's shot montage, the ALL-TANK GAMEPLAY gauntlet, the nested TANK
TRAILERS and MINIGAME TRAILERS pages with a three-shot cut-down each, and the LABYRINTH
TRAILER's scripted shot list,
both skippable
with no rewards), the labyrinth joystick steering, the track
player (listing, playing, stopping, and holding every level theme across scene changes),
the reef
tank's decorative coral bed, its two corner boulders, and the cosmetic
colorful school swimming past, asserting that the school cannot be collected and never
touches the score.

## 13. Documentation Map

| File                  | Covers                                                                              | Update when                    |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------------------ |
| `README.md`           | Entry point: quick start, project layout, links to all other docs                   | Commands, structure, or doc layout change |
| `CHANGELOG.md`        | Dated feature history: game features and game systems per batch                     | A feature batch lands |
| `FEATURES.md`         | Lore, navigation, controls, entities, scoring, HUD requirements, art/audio direction, backlog | Gameplay behavior or values change |
| `GAME_DESIGN.md`      | Architecture, engine APIs, build pipeline, workflow                                 | Structure, tooling, or APIs change |
| `src/config.js`       | The tuning values themselves                                                        | Any tuning change — mirror it in `FEATURES.md` |

Rule of thumb: player-visible behavior and requirements go in `FEATURES.md`; how it is
built and where the code lives go in `GAME_DESIGN.md`. `README.md` is the entry point
that maps to everything else; keep its links and commands current. `CHANGELOG.md`
records when each feature batch landed, split into game features and game systems; add
a dated section when a batch is committed.
