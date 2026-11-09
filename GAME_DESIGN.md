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
`minigame.js` (the shared minigame scene scaffold with fees-agnostic results plumbing),
`skin.js` (shop color catalog and player recoloring), `accessory.js` (shop trinkets
rendered onto the creatures, routed through `plushie.js` for the ragdoll plushie pack),
`trail.js` (per-entity swim wakes), `companion.js` (per-entity follower pals),
`aura.js` (per-entity orbiting rings — creature, weapon, neon, and bubble auras; the
karambit reads `palette.key` so NATURAL wears a silver blade with a gold loop, RED a
pure-red blade and loop, and SHADOW a blade pulsing pure red to pure black) and
`wardrobe.js` (`applyWardrobe(shop, player)` switches every cosmetic module to P1's or
P2's saved set for co-op rendering),
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
  pre-enables the co-op flag in the tank select, plus the `3D MODE` switch: toggling it
  calls `Game.set3D()`, which flips the `engine/mode3d.js` flag and sets a CSS
  `perspective(1100px) rotateX(22deg)` transform on the canvas element (and `none` when
  off) so every scene renders onto an angled 3D plane. While the flag is set, `Entity`
  renders in 3D — its base constructor wraps each subclass `render()` so `drawEntity3D()`
  paints a ground shadow plus one hard offset drop shadow (`shadowOffset`, no blur or
  `ctx.filter`) so each object pops off the floor at a single draw call, bubbles render as
  lit spheres (`sphere3D`), entities flagged `flat3D` or larger than 64 px keep just the
  ground shadow, and `drawWater()` switches
  to `drawWater3D()` — a perspective sky, horizon, and converging grid floor. The setting
  persists under `SETTINGS_KEY` and `main.js` re-applies it on boot. The
  canvas backing-store sizing in `Game.resize()` prefers `clientWidth`/`clientHeight` so
  the CSS tilt never skews the render resolution. Alongside it, the `FIRST PERSON MODE`
  switch (`Game.setFirstPerson()` → `setFirstPersonMode()` in `engine/mode3d.js`) turns
  every dive and minigame into a first-person **raycast** view via `engine/raycastview.js`,
  the same software-raycast look as the standalone RAYCAST TANK: when the flag is set,
  `PlayScene`, `MinigameScene` (all arcade games, dodgeball, abyss, raycast),
  `LabyrinthScene`, `TagScene`, and `AquariumScene` skip their normal world draw (after
  the HUD/overlay draws) and call `renderFirstPersonLevel(ctx, scene)`, which builds a
  camera at the actor (`firstPersonCamera()`: the yaw is seeded from the actor's heading
  once and then driven only by the mouse — relative `movementX` deltas while the pointer is
  locked, or a bounded offset as a fallback — so `A`/`D` strafing never swings the view and
  the look never sticks at a screen edge). `Game.updateFirstPerson()` (run each fixed step)
  owns that yaw and turns the pressed `W`/`A`/`S`/`D` movement keys into a camera-relative
  vector, publishing it through the synthetic `input.pointer.look` + `dragX/dragY` the
  creatures already steer with — so `W`/`S` drive forward/back along the view and `A`/`D`
  strafe, in every scene. It collects geometry with `collectWalls()` — solid boxes for the labyrinth's
  `walls`/`supports` and the aquarium's maze walls, plus an inward boundary rectangle from
  `firstPersonBounds()` — and raycasts it per column (slab against boxes, segment
  intersection against the boundary), then draws depth-sorted billboards —
  `firstPersonSprites()` returns the scene's live entities, each rendered scaled through
  its raw `entity._draw` and occluded by the per-column wall depths. `renderFrame()` still
  marks the actor with `setHiddenEntity()` so its own body is skipped; the mouse only looks
  (damped by `LOOK_SENSITIVITY`) and `WASD`/arrows steer, and `renderFrame()` sets
  `canvas.style.cursor = 'none'` while first person is on in a dive/minigame scene
  (`FIRST_PERSON_SCENES`) so the pointer disappears, restoring it in menus, and
  `Game.capturePointer()` requests pointer lock plus `documentElement.requestFullscreen()`
  on enabling or on a gameplay pointer/key gesture (released when the mode is turned off or
  a first-person scene is left), so the mouse turns the view endlessly. A corner
  `drawMinimap()` overlays the arena bounds, wall boxes, entity blips, and the player's
  heading, scaled to a fixed panel. It resolves
  the actor through
  `Scene.firstPersonActor()` (`divePlayer`/`players[0]`/`swimmers[0]`/`player`), applies
  to every dive and minigame, is independent of 3D MODE, and persists the same way.
- `DawnScene` (`dawn`) is the freshwater goal cutscene: the sun rises outside the
  aquarium window, and ENTER returns to the menu.
- `ShopScene` (`shop`) sells character colors, coin trinkets, and nine playpasses
  (1200 each, browsed with Left/Right). Its menu rows are COLOR, CREATURE, HEAD, BODY,
  TRAIL, DIVE BUDDIES, AURA, PLAYPASS, PLAYER, COSTUMES, and BACK: HEAD/BODY split
  `ACCESSORIES` by their `slot` tag into two independent equip slots (a hat combines with
  a plushie), the COSTUMES row adds a third `costume` slot whose four dish items
  (`renderCostume()`: SHARK FIN DISH, SAMBAL STINGRAY, GRILLED SQUID, PRAWN CRACKERS)
  draw a whole-body dish over the diver, while
  TRAIL, DIVE BUDDIES, and AURA browse `TRAILS`/`COMPANIONS`/`AURAS`. The PLAYER row
  switches the wardrobe between P1 and P2: every equip applies to the active player's
  `*2` slot pair (`skin2`, `head2`, `back2`, `costume2`, `trail2`, `companion2`, `aura2`, each
  defaulting to its P1 value on old saves) while purchases stay shared, so one diver can
  wear SUNSET ORANGE while the other wears RED and both sets follow them into co-op
  scenes. Pass 1 unlocks
  minigames, pass 2 grants the
  pass-exclusive MONSOON/EMBER colors and PIRATE HAT/PROPELLER CAP trinkets (ownership
  checks union `passGranted()` over `PASSES`, so granted items equip for free and cannot
  be coin-bought), pass 3 unlocks the pets tank, pass 4 unlocks the endless dive, pass 5
  grants the cosmetics bundle — eleven ragdoll plushies, the hue-cycling NEON JACKET
  tailored to each wearer through a per-entity `jacketFit` metric, and the removable
  EEL AURA trinket (`auraForShop()` feeds `skin.js` from the shop's `aura` key,
  defaulting legacy session saves that own pass 5 to the attached ring) — pass 6
  unlocks the rare pets and trained fetching, pass 7 grants the five TRAILS, pass 8
  grants the twenty-one DIVE BUDDIES (the five favourites plus mini versions of every playable
  creature and every enemy, and the MINI MEGASQUID boss buddy), and pass 9 unlocks the
  aquarium builder.
  `drawAccessory(ctx, radius, time, frame)` now carries an optional render frame
  (`{ entity, heading, flip }`) so `plushie.js` can read each wearer's velocity: every
  plushie keeps its appendage chains in a `WeakMap` of spring/damper joints
   (`STIFFNESS` 55, `DAMPING` 5.5) whose targets trail opposite `vx`/`vy` (mapped into the
   entity's mirrored render space), straighten under speed, and sway at rest,
   with per-creature specs for the seven divers, the moray, and the three rare pets.
   `src/engine/ripcord.js` (`drawRagdollRipcord()`) is a lighter verlet rope (position-based
   segments with gravity, damping, and velocity-driven inertia) used by the **RIP CORD** body
   trinket and CHAIN-FIN's starter pull-cord; it stores its rope state on the wearer under
   `_ripcord` and steps it from the render clock.
  Playable creatures render upright: every diver keeps a `facing` (`Entity.updateFacing()`
  sets it from `vx`) and its `render()` mirrors with `ctx.scale(facing, 1)` instead of
  rotating to `heading`, so swimming left faces the sprite left rather than flipping it
  upside down; the nautilus already worked this way.
  `trail.js` samples each swimmer's recent positions in a per-entity `WeakMap` and draws
  the five wakes; `companion.js` eases a floating dive buddy behind the entity along its
  velocity or heading, and the seven buddies that mirror the playable creatures redraw
  them through the divers' own exported `drawSharkBody`/`drawStingrayBody`/`drawSquidBody`/
  `drawArcticShrimpBody`/`drawKelpCrabBody`/`drawMoonJellyBody`/`drawNautilusBody`
  helpers at buddy scale, so they inherit every silhouette and the equipped color, while
  `drawMorayBody`, `drawDartEel`, and `drawElectricEel` do the same for the moray, dart
  eel, and volt eel buddies, and the MINI MEGASQUID redraws the labyrinth boss through
  the shared `drawMegasquid`/`drawMegasquidEye` helpers from
  `src/entities/megasquid.js` (periodic blinks, the eye tracking forward). It
  previews each of the seven
  playable creatures in the selected
  color (wearing the active player's equipped slots, trail, buddy, and aura), and persists
  `{ owned, skin, skin2, passes, accessories, trails, companions, auras, head, head2, back, back2, trail, trail2, companion, companion2, aura, aura2 }`
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
- `LoreScene` (`lore`, opened from the menu's LORE row) is the codex: it reads the
  `LORE` catalog — THE WRECK, THE TANKS, THE DIVERS, THE HAZARDS, and THE MINIGAMES,
  forty-four named entries in all — and renders Left/Right section tabs, an Up/Down
  entry list with a centered window and `n/m` counters, and the wrapped story text in a
  side panel.
- `TrackPlayerScene` (`tracks`, opened from SETTINGS) lists `TRACK_LIBRARY` from
  `src/assets/tracks.js` and plays or stops any tank theme through the shared
  `MusicPlayer`; playing sets `music.hold`, so the chosen theme keeps playing after the
  player is left, until it is stopped there or a dive takes over.
- **Seasonal modes** live in `src/engine/season.js`: `setSeason('none'|'christmas'|'halloween'|'newyear')`
  flips a module flag (applied on boot from `SETTINGS_KEY.season` and by the mutually
  exclusive SETTINGS switches), and `resolveSeasonTrack()` swaps any track whose `name` has
  an entry in that season's `SEASON_TRACKS` map (`src/assets/tracks.js`) for its themed
  song. `MusicPlayer.play()`/`refresh()` use it, and `refresh()` re-resolves the track
  already playing so toggling a switch swaps it immediately; `MusicPlayer` keeps the
  non-seasonal base track in `source` (and clears it on `stop()`) so turning a season off
  restores the normal theme. `Game.renderFrame()` draws the current track's `title` as a
  top-right `NOW PLAYING · …` label. `MenuScene.updateAmbient()` spawns
  `src/entities/snowflake.js` with the season's `kind` (snow/leaf/confetti) instead of
  bubbles. `Entity`'s render wrapper overlays a seasonal hat on `santa`-flagged enemies via
  `drawSeasonHat()` (santa/witch/party), and the wardrobe gains each season's accessories
  and companion. The theatre's MERRY CHRISTMAS / HAPPY HALLOWEEN / HAPPY NEW YEAR rows play
  `src/scenes/christmastrail.js` with a `season` param. Christmas mode also exposes two
  exclusive MINIGAMES rows: `PresentWrapScene` (`presentwrap`) and `SantaPeekScene`
  (`santapeek`), both `MinigameScene`s gated on `currentSeason() === 'christmas'`. They share
  `src/engine/giftshapes.js` for drawing the wrapped/wished shapes and
  `src/engine/lounge.js` (`drawWreckLounge()`) for the cruise-shipwreck lounge backdrop with its
  no-fire fireplace of drifting bioluminescent squids; `applyWardrobe()` + a `Shark` render the
  player's current skin/accessories in both. In SANTA'S NET the gifts are only drawn while
  `eyesOpen` (holding E with the peek meter off its full end); the flawed near-match shapes
  (`star_flaw`, `heart_flaw`, `triangle_flaw`) are drawn by the same `drawGiftShape()` but are
  excluded from the wishlist, and the camera sweeps quickly enough that steals must be timed.
  Halloween and New Year add their own pairs, gated on `currentSeason()`: `JackHuntScene`
  (`jackhunt`), `SpectreSweepScene` (`spectresweep`), `FireworksScene` (`fireworks`), and
  `ConfettiRushScene` (`confettirush`), all `MinigameScene`s sharing
  `src/engine/seasonroom.js` (`drawSeasonRoom()` draws the crypt or the party deck) and, where
  the shark is visible, `applyWardrobe()` + `Shark`. The MINIGAMES list itself is a windowed
  `SelectList` (`visible: 15`, `wheel: true`), and   `SelectList` now scrolls on `Input.wheel`. `ChatScene` (`chat`, opened from MINIGAMES) is a
  local, rule-based chatbot for FINN the CPU: it captures raw key codes for typing, word-wraps
  bubbles with `FONT`, draws CPU bubbles in yellow (`#ffd166`, black text) and player bubbles in
  light blue (`#bfe9ff`, gray text) over `drawWater`, and answers from a scored keyword knowledge base covering
  controls, tanks, minigames, the shop, difficulty, settings, coins, lore, and his own opinions/favourites — no network service.
- **8-bit mode** lives in `src/engine/retro.js` (`set8Bit()`/`is8Bit()`). `Game.renderFrame()`
  renders the scene into a fixed 256×144 offscreen canvas (`ensurePixelBuffer()`, drawn with a
  `PIXEL_WIDTH/width` transform so scenes keep their 960×540 logical coordinates), blits it to
  the real canvas with `imageSmoothingEnabled = false` and `image-rendering: pixelated`, then
  overlays CRT scanlines. `drawText()` switches to a monospace pixel font and drops glow blur
  while the flag is on. `AudioBus` reads the same flag: `unlock()` wires the master through a
  low-pass `BiquadFilter` and a `WaveShaper` bit-crusher, `applyRetro()` sets their values,
  `tone()` uses a warm square `createPeriodicWave` pulse with a soft envelope, and
  `MusicPlayer` turns hats into gentle noise percussion.
- `TrackBuilderScene` (`trackbuilder`, opened from the track player) is a four-track
  sequencer: a **DRUMS / BASS / SYNTH / PIANO** tab row selects an instrument whose
  `INSTRUMENTS[i].lines` are drawn as **horizontal lines** (no grid). Clicking a line (or
  moving the cursor with the arrows and pressing confirm) toggles a note in that
  instrument's `tracks[key]` note list (`{ col, line, length }`); left/right arrows move a
  column cursor and the surface scrolls (`scrollCol`) to keep it — or the playhead — in view.
  A pointer drag (`beginDrag`/`updateDrag`/`endDrag`) stretches a note's `length` as the
  pointer moves right, and a tap without dragging on an existing block removes it. Every
  note also renders as a **colored outline** while another tab is active (its line mapped
  by relative height and its step kept exact), so all four parts are visible at once. `PLAY`
  runs a `step`/`timer` loop over all four tracks at `beat = 60 / bpm / 2`, sounding drum
  `noise`/`tone` hits or pitched tones sustained for `length` steps. Entering stashes the
  current track in `previousTrack` and calls `music.stop()` (silencing the held menu
  theme); `exit()` restores it. Everything saves to `TRACK_BUILDER_KEY` as `{ bpm, tracks }`.
- `src/engine/composer.js` owns the shared instrument data (`INSTRUMENTS`, `DRUM_SOUNDS`,
  `COMPOSER_STEPS`/`COMPOSER_MIN_STEPS`/`COMPOSER_MAX_STEPS`, `midiToFreq`) plus
  `loadComposer`/`saveComposer`/`composerHasNotes` and `buildCustomTrack()`, which flattens
  the saved notes into a `byStep` array of concrete sound descriptors. The saved data is
  `{ bpm, steps, tracks }` (the builder's **L+ / L-** change `steps`, 8–128), and
  `MusicPlayer.update()` plays `byStep` directly when a track has `custom: true` (looping on
  `steps`), so the TRACK PLAYER's **MY TRACK** row plays the saved song like any other theme
  and **RUSH MY TRACK** hands it to `ReefRushScene` as a level; **EDIT MY TRACK** reopens
  `trackbuilder`.
- `src/engine/rushcourse.js` owns the REEF RUSH piece format
  (`{ goal, items: [{ kind, x, h, count, base, form }] }` under `RUSH_BUILDER_KEY`): seventeen kinds
  (`RUSH_KINDS` = shell/seaweed/ceilshell/ceilweed/rock/ceilrock/pearl/bubble/gravity/gravpad/
  ceilgravpad/pad/ceilpad/ledge/slopeup/slopedown/portal)
  with `RUSH_META` (size, ground vs air vs ceiling) and `RUSH_HEIGHTS`;
  `rushItemRect(item, groundY, ceilingY)` turns any item into its collision/draw rect (rocks and
  ceiling rocks use `count` for stacking, the floating **ledge** sits at any height via `h`,
  portals use `form`, ceiling pieces hang from `ceilingY`, and a `base` offset lets a shell/weed
  or a bubble pad sit on top of a rock, a floating ledge, or hang under a ceiling rock). The stingray, jelly, eel, urchin, and fish
  survive as **portal target modes only** (`RUSH_PORTAL_FORMS`), not hazards; an old save naming
  one of them as a hazard is migrated to a `portal`. `RushBuilderScene`
  (`rushbuilder`, opened from MINIGAMES) is the editor: arrows move a cursor, a **vertical
  scroll list on the right** (scroll with `Q`/`E`, the **mouse wheel**, or click a row, or
  `1`–`0`) lists the pieces (SHELL/SEAWEED/CEILING SHELL/CEILING WEED/ROCK/CEILING ROCK/PEARL/
  PRESSURE BUBBLE/GRAVITY BUBBLE/GRAVITY BUBBLE PAD/CEILING GRAVITY BUBBLE PAD/THRUST BUBBLE
  PAD/CEILING THRUST BUBBLE PAD/FLOATING LEDGE/SLOPE UP/SLOPE DOWN) then the modes
  (STINGRAY/DART EEL/CRAB/URCHIN/JELLY/FISH), Enter/click places (a portal carries the selected
  mode's `form`), **clicking a rock or ceiling rock again stacks it**, a **hold + vertical drag
  resizes a piece**, `X` removes, `C` clears, `G-`/`G+` set the goal; `TEST` launches it from the
  start and `TEST HERE` (`T`) launches it from the cursor as `{ startX }`, which `buildRound()`
  turns into a starting `scrollX` and calls `spawnSurfaceAt()` to stand the fish on the nearest
  landable surface (ground, rock, or ledge) so any stretch of the course can be tried, with a
  `fromBuilder` flag, so a crash shows a **BACK TO BUILDING** result action (and Esc returns to
  the editor) instead of the normal minigame menu, and test runs are not recorded. All
  edits save immediately.
- `src/engine/rushlevels.js` holds the **original hand-authored levels** (`RUSH_LEVELS`),
  the progress store (`RUSH_PROGRESS_KEY`, `{ beaten: [] }`), and `beatLevel()` which records
  a first clear and adds the level's `skin` to `SHOP_KEY.owned`. `RushLevelsScene`
  (`rushlevels`) is the **sideways-scrolling** level select (Left/Right scroll, Enter plays;
  cards show cleared state and a `MY COURSE` card). Each level declares a `form` (sunlit→fish,
  kelp→eel, stingray→stingray, jelly→jelly, current→urchin) that `buildRound()` sets as the
  starting swimmer; the level data builds mode-specific geometry with `pillar()` (a ceiling-rock
  stack and a rock stack with a hole between them) and `eelGate()` (a hanging weed and a ground
  rock with a vertical gap). `ReefRushScene` with `{ level }` builds
  that level's items (via `buildItems`, offset by a start pad, constant speed); reaching the
  goal calls `clearLevel()` → `beatLevel()` + `recordWin('reefrushlevel')` → the
  `RushClearScene` cutscene. `ReefRushScene` with `{ course: true }` runs the player's
  builder course instead and records under `reefrushcourse`. The game ships only its own
  original levels; every other course is player-authored.
- `TheatreScene` (`theatre`, opened from SETTINGS) lists every `CUTSCENES` entry — the
  game trailer, the
  intro splash, the eight `TANK_INTROS` descents, the dawn cutscene, the labyrinth
  trailer, and the labyrinth
  finale — and launches each with a `from: 'theatre'` param (`{ trailer: true }`,
  `{ arrival: true }`, or
  `{ ending: true }` for the labyrinth) so `IntroScene`, `TeleportScene`, `DawnScene`, and the labyrinth's trailer/arrival/ending
  phases all return to the theatre instead of their normal destinations, with no minigame
  rewards recorded. An `ALL-TANK GAMEPLAY` row launches the gauntlet trailer directly, a
  `SHOP TRAILER` row runs the trailer in shop mode (`{ shop: true }`), a
  `WRECK ARRIVAL` row replays the labyrinth's arrival cutscene, and
  the `TANK TRAILERS` and `MINIGAME TRAILERS` rows swap the list for nested pages
  (`createMenu('main' | 'tanks' | 'minigames')`) of `TANK_TRAILER_LIST` /
  `MINIGAME_TRAILER_LIST` rows — launched as `trailer` with `{ tank }` or `{ minigame }` —
  with `BACK`/Esc stepping out to the cutscene list while the main page keeps its denser
  layout for nineteen rows.
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
  `enter({ movie: true })` runs **SHARKQUARIUM: THE MOVIE**, the longest cut in the
  theatre: `movieShots()` books a title card, the same nine tank gameplay shots, an
  INTERMISSION card, one gameplay shot per minigame (setting `this.minigameId` per shot
  so `buildMinigameShot(view)` casts it), and a THE END card — sixteen shots in one
  ~55 s feature. The movie branch of `applyShot()` routes each shot to its builder
  (`shot.tank` / `shot.minigame` / the card's ambient `game` build), `isCard()` treats
  only flagged cards as cards so the footage plays continuously, and the overlay header
  reads `SHARKQUARIUM — THE MOVIE`. `enter({ shop: true })` runs the **SHOP TRAILER**:
  `shopShots()` books a title card, five dress-up shelves (colors, head trinkets, body
  wear, trails and dive buddies, auras), and three closing cards (sea coins, playpasses,
  dress-up-then-dive); the shop branch of `update()` cycles the trailer's live cosmetics
  (`skinByKey` / `accessoryByKey` on the color, head, and body shelves and
  `trailByKey` / `companionByKey` / `auraByKey` on the trail and aura shelves),
  `buildShopShot()` lines the seven creatures up mid-water, `render()` feeds the actives
  to `drawSkinAura` / `drawTrail` / `drawCompanion` for every performer, and the overlay
  header reads `SHARKQUARIUM — SHOP TRAILER`.
- Six paid arcade games share `MinigameScene` (`src/engine/minigame.js`), which owns the
  enter/reset/results scaffolding, the standard PLAY AGAIN / MINIGAMES menu, per-player
  wardrobes via `applyWardrobe`, and `finish(won)` (which pays through `recordMinigame`):
  `PufferballScene` (`pufferball`) is first-to-three puffer volleyball against P2 or a
  CPU chaser; `RoundupScene` (`roundup`, solo) herds three fleeing sardine schools into
  the left net before the clock; `StealthScene` (`stealth`, solo shrimp or co-op with a
  kelp crab) sneaks past three patrolling seals with vision cones and rock cover,
  respawning at checkpoints on three spot-outs; `TrenchScene` (`trench`, solo) is a
  60-second descent through scrolling ice barriers, gold pearls, currents, and dark
  bands with three hits; `spawnBarrier()` clamps each wall's `gapWidth` opening to within
  `  maxGapShift` (220 px) of the last one, so the diver can always reach the next gap and
  the run is winnable rather than a random dead end; `TrenchExploreScene` (`trenchexplore`,
  solo) is a **timeless buoyancy dive**: the diver is integrated directly (space thrusts
  up, gravity sinks, `QUIET`-style drag) down a vertical shaft (`camY` follows the diver),
  gathering `coinBubbles` in each trench while a surface boat's `net` runs an
  `idle`/`warn`/`down`/`hold`/`up` cycle; sinking below `net.depth + radius` avoids it, and
  clearing a trench (`clearTrench`) advances to a deeper, faster one (`netMaxDepths` /
  `coinCounts`). Clearing the last trench runs a `phase: 'rising'` cutscene
  (`drawMegasquid` rising out of the trench tearing a shipwreck apart) and then a
  `phase: 'boss'` upward chase where `bossNets` appear at depths instead of trenches — an
  active net overlapping the `squid` sets its `stun` (freezing the chase), and reaching
  `escapeY` wins. `buildCritters()` scatters cosmetic life per trench (`moray`, `weed`,
  `crab`, `octopus`/`squid` corals, and `ray` variants) and `updateCritters()` drives them:
  crabs bolt from the diver, and a `ray` overlapping the descending net is **scooped up**,
  its `skin` pushed into `SHOP_KEY.owned` to unlock a free shop skin. `JellyAscentScene` (`jellyascent`, solo) pulse-bounces a moon
  jelly up a scrolling shaft of ring gaps and updrafts; and `CleanupScene` (`cleanup`,
  solo or co-op) nudges floating wreckage into the recycle net while three moray holes
  lunge, its HUD keeping the `RECYCLED n/target` counter and running with no clock at
  all — the round ends on the recycled target. Each hole runs a smooth
  `peek`/`bite`/`retreat` cycle: `rise` and `jaw` ease toward per-phase targets
  (`peekHeight`/`biteHeight`, `peekTime`/`biteTime`/`retreatTime`, with `biteEase` for
  the fast strike), the long body glides out of the hole behind the head — a
  `paintMorayTrail` ribbon whose span grows with `rise`, clipped at the floor lip — and
  every hole wears the stingray tank's `EEL_VARIANTS` by index (brown, olive, spotted
  y). `ReefRushScene` (`reefrush`, solo) is the original rhythm-runner: the reef
  auto-scrolls (`scrollX`), the fish auto-runs at `REEF_RUSH.playerX`, and one
  `confirm` press jumps (with coyote time and a jump buffer). Every course is a list of
  pieces turned into obstacles: `rushItemRect()` gives each a rect, floor **rocks** and
  ceiling **rocks** (`ceilrock`) are landed on (`count` stacks them) and the floating **ledge**
  (`ledge`, a thin slab at any `h`) is standable, and **slopes** (`slopeup`/`slopedown`, `w`=150)
  carry the swimmer up/down by snapping `player.y` to the sloped surface at the player's x; floor/ceiling shells
  (`shell`/`ceilshell`) and weeds (`seaweed`/`ceilweed`) are lethal, pearls/bubbles/
  gravity-bubbles are click pickups, and the **gravity bubble pads** (`gravpad`/`ceilgravpad`)
  and **thrust bubble pads** (`pad`/`ceilpad`) trigger on **mere overlap**. Gravity is a single signed `dir`
  (`gravityUp`) that the fish/stingray/eel/jelly physics and the floor/ceiling landings all
  respect, so **any mode** flips cleanly.
  **Portal** pieces switch the player's mode: `FORM_PHYSICS` gives `fish` (run/jump, default —
  a **FISH** portal turns an transformed player back into it),
  `stingray` (gravity + hold-to-thrust), `eel` (a 45°-ish dart at constant vertical `dart`;
  **hold** to climb, a **short click** sets `dartTap` (~0.09 s) for a small zig, and with no
  input it **automatically sinks back down** diagonally — it appends to
  `dartTrail` for the trailing body), `crab` (each click
  `flipGravity(true)` snaps it to the nearest landable surface — floor, ceiling, rock, or
  floating ledge, found by `nearestSurfaceY()`), `urchin` (`flipGravity(false)` + gravity toward `gravityUp`), and `jelly`
  (gravity + press-only hop with a short cooldown). `enterPortal()` sets `this.form` when the
  player overlaps a portal of a different form, and `renderPlayer()` draws each mode. The
  **DART EEL** wears the Nautilus Tank's dart-eel head (`drawDartEelHead()`) but paints its
  tail with the **moray eel's trail renderer** (`paintMorayTrail()` from `src/entities/eel.js`,
  given a green dart-eel palette): the last ~34 head positions from `dartTrail` become the
  spine, so the tapering, ridged body **trails behind the head along the path it has swum**,
  curving through its previous turns. It draws at a **0.62 scale** (smaller); the other four
  modes draw at **0.78 scale** so they sit comfortably inside the same hitbox.
  The **STINGRAY** portal icon and player mode both reuse `drawStingrayBody` from
  `src/entities/stingray.js` with the **spotted-ray** palette (`SKINS.spottedray`), so they
  match the Stingray Tank. Air pickups are **pearls**, **pressure bubbles** — a `bubble`
  overlap with a fresh `jumpPressed` (gated by `bubbleCooldown`) sets `player.vy = -jump*dir`
  for a free boost that works even in mid-water — and **gravity bubbles**, whose overlap with a
  fresh `jumpPressed` calls `flipGravity(false)` to turn gravity upside-down **in whatever mode
  the player is in** (already upside-down, it is a no-op so a second bubble does not flip back).
  A **gravity bubble pad** flips gravity on **touch** (toggling `gravityUp`, gated by
  `padCooldown`), and a **thrust bubble pad** fires an automatic extra jump away from its mount
  (`player.vy = ∓jump*1.25`) on **touch**, like a rhythm-runner jump pad.
  Four sources feed the same loop — the **original classic course**
  (`buildClassicCourse()` from `REEF_RUSH.course`), a **level** (`buildItems()` from
  `RUSH_LEVELS`), **your song** (`{ custom: true }` → `buildCustomCourse()`, drums→shells,
  bass→rocks (sometimes a 2-stack), synth/piano→pearls, synth→hanging ceiling hazards; it
  merges each step's chord into one capped shell/rock, spaces ground obstacles at least
  `max(cfg.minGap, 200)` apart so they stay clearable, and rotates the gaps through
  gamemode-friendly devices — a cycling portal (stingray/eel/crab/urchin/jelly/fish), a floating
  ledge, a thrust bubble pad, or a gravity bubble), or **your hand-built
  course** (`{ course: true }` →
  `buildItems()` from `RUSH_BUILDER_KEY`). All use `REEF_RUSH_TRACK` at constant speed except
  the song mode, which plays `buildCustomTrack(composer)`. The run wins at `goalDistance`;
  level runs go to `RushClearScene`, the others to the results screen. Only original course
  data ships — the genre's pacing is echoed, never an existing game's layout.
  Fees live in `MINIGAME_FEES` (25–60 coins) and are charged by
  `MinigamesScene.choose()` on every entry from the menu; `PLAY AGAIN` after a round
  stays inside the paid session.
- `AbyssScene` (`abyss`) and `RaycastScene` (`raycast`) are the two standalone tanks in
  the tank select: their options carry a `{ scene }` param, so `TankSelectScene.choose()`
  routes them straight to the scene instead of `play`. **ABYSS** is a three-phase boss
  arena — the `Leviathan` entity state-machines `hunt → summon → telegraph → lunge →
  recover`, drawn navy blue (`leviathan`/`leviathanDark`) with glowing cyan dots on its
  tentacles, body rim, and a long swaying `renderTail()` and a big `renderEye()` bright-blue
  eye (`leviathanEye`) whose **white circular pupil tracks the nearest diver** (the
  `gaze` angle is taken from the stored nearest threat and converted to local space),
  flanked by two smaller eyes with the same look; a `blinkTimer`/`blinkHold` pulse closes
  all three eyes periodically, and the shared `drawLeviathanEye()` also draws the navy
  trenchlings' single giant eye; its eye is only weak while
  staggered (`vulnerable`, gated on `ABYSS.ramSpeed`),
  damage bumps `phase` at 1/3 and 2/3 health (`phaseSpeed()` accelerates lunges and adds
  `trenchlings` each summon; the post-lunge stagger window `ABYSS.recoverTime / phaseSpeed()`
  shrinks each phase), a lunge that connects costs one of three lives, and the HUD
  draws a segmented health bar and hearts. **RAYCAST** is a Canvas2D software raycaster:
  `generateMaze()` carves an odd-sized grid with a seeded LCG, `castColumn()` steps a ray
  to the first wall, and `renderRound()` draws distance-shaded wall columns over a
  ceiling/floor gradient with a live minimap; the round is won by collecting every bubble
  then reaching `exitPoint`. Both extend `MinigameScene` for the results/particle
  scaffolding but override `backScene()`/`chooseResult()` to return to `tanks`.
- `ReefQueenScene` (`reefqueen`) is the second boss tank, built on the same
  `MinigameScene` scaffold: the `SwarmQueen` entity cycles `hover → summon/telegraph →
  open` (and `telegraph → charge → open`), so its glowing core is weak only while `open`;
  `damage()` bumps `phase` at 1/3 and 2/3 health (`phaseSpeed()` speeds charges, grows the
  swarm, and shrinks the opening), the scene spawns `Swarmling` entities (`spawnSwarm()`,
  `SWARM_QUEEN.swarmlings` + per phase) that home the nearest diver, a charge that connects
  costs a life, and divers can pop swarmlings by   ramming them (`popped`).
- `QuietScene` (`quiet`) is the horror stealth tank, built like a cut-down labyrinth: it
  generates **sections** (`QUIET.sections` × `sectionLength`) of metal `walls` with
  swim-through gaps, scattered `Clutter`, and hide alcoves, scrolls via `updateCamera()`,
  and **checkpoints** — passing a `checkpoints` mast banks it, and `respawn()` returns the
  diver there (resetting noise, the echoeel, seals and debris) after a scare instead of
  ending the run; the win is reaching `exitZone` at the end. It opens in a
  `select` phase (a `SelectList` that cycles the seven `DIVE_CREATURES`, then START/BACK)
  and plays a `phase: 'arrival'` cutscene before the dive: `startArrival()` opens an
  intergalactic atom `rift` in the lab, then `arrivalEchoeel` (a real `Echoeel`) passes
  through it (`reveal`) as the seven `arrivalCrew` divers swim in; the chosen creature is
  spawned as
  the player in `buildRound()`. A really dark-grey, finless eyeless `Echoeel` (`echoeel.js`), a long eel body
  with a long undulating tail (`renderTail`) lined with tiny black spikes and tipped with a black shark caudal fin
  whose armored head `renderHead()` hinges its lid open from the teeth to the top with a
  runaway gape (`open` scales the upper jaw by 1.8× and drops the lower by 0.65×, stretching
  a black gullet and elongating the teeth) — a dark
  mouth interior behind rows of long needle teeth — and which renders upright with the same
  `ctx.scale(facing, 1)` flip as the divers — drifts (`pickWander`, bounded by `worldWidth`); `Clutter` topples call `emitNoise()`,
  raising `noise` and `alertTo()`ing the alien at the junk, whose `update()` runs `alert → charge`
  `→ search`; a noise alert points it at the touched junk, so — blind — it charges and `shatterJunk()`s
  it (planks + shake) even if the diver is concealed, and it **never homes on the diver**. It
  only takes the diver when they are still beside that junk as it strikes (`QUIET.shatterCatch`)
  or drift within `QUIET.touchRange` of it in the open, and not concealed; every `QUIET.echoEvery` it sends an
  expanding echolocation sweep out to `QUIET.echoRange` (the drawn ring), and a diver it reaches
  in the open is `startScare()`'d, while overlapping a hide alcove (`hidden`) or a `walls` bulkhead across the
  line of sight (`hasLineOfSight()` / `segmentHitsRect()` build `concealed`) keeps the diver safe
  from it. `noise` held over `QUIET.scareHold`
  (2 s) calls `startScare()` — a `renderJumpscare()` ending the run. `enter()` swaps the
  held theme for `QUIET_TRACK` (a 64 BPM D-tritone horror drone, `music.hold` cleared) and
  `exit()` restores whatever was held; `render()` ticks `setSkinClock(this.time)` so the
  diver's skin aura/pulse animates like the other scenes. Each play frame draws the world,
  then `renderDarkness()` lays a near-black radial around the diver (`QUIET.visionRadius` /
  `visionSoft` / `ambientDark`, with a slight flicker), then `renderDarkLayer()` redraws the
  echo sweep, faint hide/exit markers, and the **always-visible** alien on top so only the
  creature is lit out of the dark; `updateAmbience()` schedules low filtered `audio.noise()`
  and `tone()` cues (rumble, groans, creaks, drips, static) plus a **proximity heartbeat**
  whose rate rises with closeness and `noise`. `startScare(kind)` stores `scareKind`
  (`sonar`/`snap`/`lunge`/`breach`) that picks a `renderJumpscare()` variant, bulkheads
  carry claw scratches, and drifting empty `ghosts` suits litter the sectors. Phase-2 horror
  systems hang off `updateHorror()`: a `danger` value (closeness/noise) **tightens the
  `renderDarkness()` light** (`QUIET.visionTighten`) and drives a subtle screen zoom; fast
  swimming raises `noise` (`QUIET.moveNoise`); steam `vents` erupt and `emitNoise()` to lure
  it; `slamDoors` seal behind the diver (pushed into `walls`); six `remains` — the dead
  scientists who crewed the lab — surface a final log line
  (`QUIET_REMAINS`); and `phantoms` are low-alpha false echoeels that dissolve. The quiet
  tank has **no roaming end-of-run chase** (that lives in `FloodScene`), but within
  `QUIET.finalLungeRange` of the hatch a **scripted near-miss** fires: the echoeel is
  snapped to just behind the diver at `QUIET.finalLungeSpeed`, `relentless` and locked on,
  and clamped to stay `QUIET.touchRange + 6` away (the ping/contact/strike catches are
  skipped under `finalLunge`) so it **barely misses** and the diver reaches `exitZone`
  first. The scene
  opts into
  `FIRST_PERSON_SCENES`, rendering a tight fogged raycast (`firstPersonRange`/fog, no
  minimap) with `firstPersonSprites()` including the alien, clutter, ghosts, remains, vents,
  and phantoms.
- `QuietScene` also backs **`FloodScene`** (registered as `flood`, "THE ESCAPE"), its own
  standalone tank: the same class with `this.name === 'flood'` entering `flood` mode, the
  diver picker reused, and `buildFloodRound()` replacing the stealth sections with a
  **corridor-only** open course (`sectionCount 0`, no bulkheads), `debris`, two
  checkpoints, and a `trueExit` at the end; the echoeel starts `relentless` at
  `QUIET.part2Speed` from off-screen and `phase2` is on from the first frame, so it is a
  pure — but winnable — chase (`part2Speed` is below the diver's `PLAYER.maxSpeed`, so a
  clean runner gains ground and only a stalled dodger is caught). `startArrival()` skips
  the rift cutscene for flood mode (just `acknowledgeFlood()`), and `updateChase()`
  (called only in flood mode) keeps the shade locked on the diver. Reaching `trueExit`
  starts a **`phase: 'outro'` cutscene** instead of ending immediately: `startOutro()` /
  `updateOutro()` stage the ECHOEEL slamming into a glass pane, the pane shattering
  (`outroShattered`, particles + shake + flash), the shade tumbling through and then
  **sinking toward the trench**, and `renderOutro()` draws it card by card before
  `finish(true)` after `QUIET.outroDuration`. `resetAhead()` keeps `phase2`/`finale` latched
  in flood mode so death only resets the chase, and `respawn()` re-places the shade behind
  the last mast.
- `WatcherScene` (`watcher`, "THE WATCHER") is the **look-away** tank: an open, pitch-dark
  trench where the diver's **gaze is the only light**. `currentGazeAngle()` aims from the
  pointer (top-down) or `firstPersonYaw` (first-person), and `renderGaze()` masks everything
  outside the beam with an even-odd clip plus `renderConeLight`. `Watcher` entities
  (`entities/watcher.js`, a big single-eye body with tendrils) are `observed()` — inside
  `QUIET`-style range and half-angle and with the gaze active — and **freeze** only while
  observed, else stalk at `WATCHER.stalk[sector]` toward the diver; a catch runs
  `startScare()`/`respawn()`. A `stare` meter drains while looking and, when it empties,
  forces a `blink` (`blinking`) that shuts the beam and lets the watchers advance.
  Sectors spawn `WATCHER.coins` bubbles and `WATCHER.watchers` stalkers, checkpoints bank
  respawns, and reaching `exitZone` wins; the scene opts into `FIRST_PERSON_SCENES`
  (`renderFirstPerson()` uses a tight `renderFirstPersonLevel` fog with the watchers and
  coins as billboards), and the diver's `pointerSteering` toggles with the mode so WASD
  drives it camera-relative only in first person.
- `MouthScene` (`mouth`, "THE TRENCH MOUTH") is the **anchor-against-the-gulp** tank: the
  trench floor is one maw that runs `idle → warn → inhale → bite` in `updateGulp()`. During
  `inhale` an unbraced diver is pulled down (`MOUTH.suction[sector]` added to `y`/`vy`),
  and a diver at or below `safeY` (above `MOUTH.mouthDepth`) in the maw when it `bite`s is
  `startScare()`'d/`respawn()`'d. Ceiling `anchors` are grabbed by holding **`SPACE`** within
  `MOUTH.grabRange` (`heldAnchor`); a braced diver is pinned and ignores the suction. Four
  sections field stronger/longer gulps and fewer holds, `coinBubbles` clear a section, and
  reaching `exitZone` wins; it opts into `FIRST_PERSON_SCENES` with a tight fog and
  anchors/coins as billboards.
- `PrehistoricScene` (`prehistoric`, "PREHISTORIC TANK") is the **playable-lungfish chase**:
  a horizontal corridor in **three zones** (`PREHISTORIC.zoneLength`): open **Devonian sea**,
  a **swamp** of ground with **water gaps**, and mixed **highlands**. `Lungfish`
  (`entities/lungfish.js`, a `Shark` subclass with a fin-legged render) is driven manually in
  `updatePlayer()`: over water (`isWater(x)`) it **swims** (`thrust`/gravity/drag), over
  ground it **runs** and **jumps** (`SPACE`). Three chasers swap by zone in
  `updateChasers()`: the **DUNKLEOSTEUS** chases in the sea but is **stunned by ammonites**
  (`dunkDistract`), the **VELOCIRAPTOR** runs the swamp and **won't cross the water gaps**,
  and the **TITANOBOA** (`drawSnake` trail) chases the highlands slower in water. Entering
  zone 3 plays a `phase: 'intro'` cutscene (`drawSnakeOnTree`) before the snake activates;
  `startScare()`/`respawn()` bank the zone starts, and a three-part progress bar tracks the
  run to `worldEnd`.
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
  hands off to `startArrival()`, the skippable `LABYRINTH.arrivalDuration` opening
  cutscene: it builds the course, swims all seven `DIVE_CREATURES` in from off-screen
  (`arrivalCrew`, staggered speeds and lanes, a small recoil once the boss shows), then
  rises the MEGASQUID (`arrivalMegasquid`, `reveal` ramping over 1.1 s from
  `LABYRINTH.arrivalReveal`) before calling `resetRound()` — which builds the course and
  spawns each player's picked class (`maxX: worldLength` bounds on all seven). A start
  matching the saved part shows the `RESUMING` banner; a hand-picked one does not.
  `finish()` clears the save on a full escape and otherwise stores the highest part
  reached (when part > 1) so the next `enter()` resumes there. `buildCourse()` lays five
  sections of wooden
  gate walls and floor/ceiling stubs (`resolveCircleRect` keeps players out of them),
  carves a hull tunnel through every gate tall enough to hold one
  (`tunnelHeight`/`tunnelMargin`; `renderTunnel()` clips the opening with `roundRectClip`
  and fills it via `drawShadowedPlanks()` — the wall's plank gradient a shade darker, with
  cross-lines and a barnacle — so the tightest passages can always be swum straight
  through) — sprinkles hull ribs,
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
  and a tip that curls harder as it reaches (`curlStart`/`curlBase`/`curlGrab`); ceiling
  arms wear the squid's feeding club (`club: true`), replacing the round tip cap with a
  dark-rimmed diamond pad studded with rows of pale suckers
  (`renderClub`),
  and switch to the squid-rope profile (`rope: true`): a thin, near-uniform `ropeWidth`
  ribbon whose sucker rows scale up (`renderSuction` floors the dots at 2.2/1.7 px so
  they stay legible on the slim arm), all in the MEGASQUID's deeper palette
  (`tentacleDark` body, `tentacleDeep` rim, `tentacle` ridge).
  For
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
  in two beats — the first `endingEscapeTime` seconds keep the wreck's squid as the
  MEGASQUID (`drawSquid` at scale 1.75, delegating
  to the shared `drawMegasquid`/`drawMegasquidEye` from `src/entities/megasquid.js` along
  with the background watcher, the arrival cutscene, and the MINI MEGASQUID buddy — all
  now drawn fully opaque, `alpha` only fading the arrival reveal)
  tangled in the collapsing wreck with tumbling
  debris while all seven `DIVE_CREATURES` instances (`escapees`) swim clear; the rest
  (`renderEndingTrench()`) cuts to a distance shot — the seven survivors float in the
  foreground facing the liner (`heading = PI`, `facing = -1`) while a hand-drawn
  `drawDistantWreck()` dangling the MEGASQUID over a `drawEndingLedge()` rock shelf tips
  off the rim and sinks into the abyss as `endingSinkDelay`/`endingSinkTime` ease its
  fall and fade; scripted impact/escape/trench/settle events fire bursts and tones, and
  Enter/Esc jumps
  ahead to the results panel. The run is a seven-part gauntlet:
  `resetRound()` builds part one, `checkResults()` calls `advancePart()` once every
  player has escaped the current part (and `finish()`es early if anyone is caught or
  after part `LABYRINTH.parts`), and `setupPart()` rebuilds the course, refills grabs,
  clears the per-part flags, and repositions the divers. `buildCourse()` scales with
  `this.part`: an extra section every `partSectionStep`, extra cracked mounds every
  `partCrackStep`, extra wall ambushes every `partWallBurstStep`, the tunnel margin grows
  `partTunnelMargin` per part (fewer shortcuts), and the wall speed gains `partSpeedRamp`
  per part under a cap that itself rises `partCeilingRamp` — then the cap is further
  pinned to `wallPlayerRatio` (66%) of the slowest player's `maxSpeed` (every player
  class reports its `maxSpeed`), stored as `this.wallCeiling` so slower creatures like
  the moon jelly can never be outrun. The picker builds the stingray with `burrow: false`
  (`Stingray` accepts a `burrow` option), so it cannot bury itself in the wreck deck and
  skip the wall with its 130 px/s crawl; supports break at `supportRamSpeed` (190 px/s)
  — `breakSupport()` restarts the wall at `-wallStart`, the part's spawn position, never
  moved forward, a flat reposition that no difficulty's `enemySpeed` can shrink.
  `breakSupport()` also calls `collapseNearbyStub(tangleX)`: it scans the hanging
  ceiling stubs (`wall.y <= 0`, width `stubWidth`) at or behind the tangle edge, splices
  the closest one out of `this.walls` (so its brace opens up), and spawns a full-size
  `CeilingStub` at that spot to tumble down onto the tangle — falling under
  `collapseStubGravity` to a random `landY` between `collapseStubLandTop` and the floor
  less `collapseStubLandBottom`, where `collapseStubImpact()` bursts dust, splinters,
  deep-red sucker sparks, and `BreachChunk`s as it settles and fades over
  `collapseStubLife`. When no stub sits within `collapseStubRange`, the fallback
  `dropCeilingStubs()` rains `collapseStubCount` stub-sized `CeilingStub` planks (scaled
  `collapseStubScaleMin`–`collapseStubScaleMax` across `collapseStubSpread`) instead; the
  `collapseStubs` list updates and culls beside `collapseChunks`. Because the reset parks
  the tangle at the part start, `breakSupport()` also records the old edge in `crushFades`
  (a `collapseCrushFade`-second entry), and `renderTentacleWall()` paints each one through
  `drawTangleFade()` — the same pitch-black gradient the live tangle uses — easing out as
  its timer drains, so the stubs fall onto a visibly crushed tangle that recedes a beat
  after the reset.
  `setupPart()` adds an arm
  every `partGrabberStep`, shortens every ambush and ceiling warn window and cooldown by
  `partWarnScale`/`partCooldownScale` per part, and scales chunk fall speed by
  `partFallRamp`. PLAY AGAIN rebuilds part one on a fresh course.
  `crackSpots` mark cracked floor mounds (kept clear of floor-reaching
  walls) and `wallBurstSpots` mark wall faces (picked from `gateSpans` so bursts avoid
  tunnel openings), while `ceilingBurstSpots` (kept 120 px clear of walls, supports,
  ceiling beams, and floor cracks) mark ceiling planks hiding a single arm that bursts
  downward at `angle: PI/2`, out-reaching every other ambush (`ceilingBurstLengthScale`
  1.25 against the 0.9 of mounds and wall faces)
  (`ceilingBurstsPerSection`, growing every
  `partCeilingBurstStep` parts); each runs one shared warn/burst/cooldown state machine
  (`updateAmbush`) — a live player within the ambush's trigger (x only for mounds and
  ceiling planks, x and y for wall faces) makes it glow for its warn time, then the mound's `arms` (one arm per
  `crackArms`, fanned with anchor offsets and spread angles) or the wall's single arm
  erupts in burst mode (mounds upward at `angle: -PI/2`, walls sideways at 0/PI):
  `burstStaggered()` ripples the mound's arms middle-outward a small `burstStagger`
  (0.18 s) apart through `burstDelay`, and each arm snaps out in `burstThrustTime`
  (0.1 s) — a perfect spear with no wave and no curl (`straight`, `curlGrow` 0), sold by
  the dust-ring breach flash, `BreachChunk` planks (spinning five-sided debris flung
  outward with gravity and a short fade) and an eruption tone plus screen-shake kick
  (pitched per arm) from `updateAmbushArm` at each emergence. Then every tip curls together:
  `burstStaggered()` computes one shared curl moment
  ((n−1)·`burstStagger` + `burstThrustTime`) and each arm's `curlThreshold` counts back
  from it, so the ripple holds rigid until the last spear lands, then every lance stays
  straight `burstLance` (0.45 s) longer; `curlGrow` ramps the tip
  curl in over `burstCurlTime` and the grab window opens at `burstGrabAfter` curl
  progress (sampling the straight base through the curled tip), before retracting at
  `curlThreshold` + `burstLance` + `burstHold`. Ceiling planks set
  `aim: true`: `aimAmbushArm()` leans the arm at the nearest live diver (clamped to
  `ceilingBurstAim` off straight down) and caps its length at the diver's distance via
  `Tentacle.stretch`, so the spear points and stretches after them frame by frame — out
  to its full length when the diver is beyond reach, and no further — and an aimed arm
  also grabs off its straight base tip without waiting for the curl gate. After a `burstHold` of
  grab time the arm retracts over `burstRetract` and the ambush cools down. The pack arms
  keep their usual writhe (`straight` stays 0) and grab through samples of their lower
  and outer arm (`burstDuration` is shared).
  `ceilingSpots` mark cracked ceiling beams: `updateCeiling()` warns when a live
  player is directly beneath (`ceilingTriggerX`), then drops a `CeilingChunk` under
  gravity — a hit calls `stagger()`, knocking the player around and freezing control for
  `ceilingStun` seconds while the wall keeps coming. `buildMorayHoles()` seeds one or two
  tiny holes into each floor stub (`morayHolesPerStub`, inset `morayHoleInset`); when a
  diver comes within `morayTriggerX`, `updateMorayHoles()` runs the REEF CLEANUP
  peek/bite/retreat cycle (`CLEANUP.peekHeight`/`biteHeight`/`lungeEvery`, same easings)
  with the moray's `EEL_VARIANTS` palette — a bite under `morayReach` calls
  `morayBite()`, which stuns and knocks the diver back — and `renderMorayHoles()` draws
  the dark hole plus the emerging head, clipped above the stub top. `updatePickups()` then keeps a fresh
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
  stingray-tank bite plays. `LABYRINTH MODE: ON/OFF` (persisted beside the items) builds
  a seeded wreck course from `AQUARIUM.labyrinth` via `buildLabyrinth(seed)` — four gate
  walls alternating hanging/floor with `laneGap` lanes (60% of tall spans carve a
  `tunnelHeight` hull tunnel into two pieces, its opening clipped with `roundRectClip` and
  filled by `drawShadowedPlanks()` like the hand-placed holed walls), three alternating stubs, two hanging
  cracked supports, three floor crack mounds, and two ceiling beams, laid out past the
  palette. In `DIVE AS` the diver resolves against the wall rects and support columns
  (`resolveCircleRect`) while the decor stays cosmetic to the residents; toggling on
  rolls a fresh seed and saves it, so the layout survives reloads. With the mode on,
  `palette()` appends `AQUARIUM.labyrinthKinds`, so the nine wreck pieces can be placed
  by hand as ordinary items: `LabPiece` (`src/entities/labpiece.js`) builds wall/stub/
  support/holed rects from the click point (walls hang or rise as long as the click, holed
  walls carve a tunnel) and renders the wreck planks — the tunnel hole is clipped to its
  ellipse and filled by `drawShadowedPlanks()` (the same plank gradient a shade darker,
  plus cross-lines and barnacle dots, so it reads as shadowed wood, not a flat black void)
  but stays out of `rects`, so the diver still swims straight through it — while `LabBurster`
  (`src/entities/labburster.js`) is a warn/burst/cooldown ambush owned by the scene:
  `updateBurster()` warns near a live diver, `burstBurster()` ripples its `Tentacle` arms
  middle-first with the shared curl moment (reusing `LABYRINTH.burstStagger`/
  `burstThrustTime`) and flings `BreachChunk`s, the curled tips knock the diver back
  through `bump()`, and the per-arm eruption tones and screen shake match the labyrinth.
  The ceiling beam fires at any depth (a beam's `triggerY` is null, so a diver directly
  under it always wakes it), aims and stretches at the diver with the labyrinth's
  `ceilingBurstAim`/`stretch` math, and out-reaches the floor crack
  (`bursterBeamLengthScale`).
  Bursters arm only in `DIVE AS` and never in CHILL mode; placed pieces collide in the
  dive via their rects. Esc surfaces to
  the workshop; a second Esc leaves for the menu. Pet residents are seeded with
  `drainScale: 0` so they never go hungry in the workshop. In the pets tank the pointer
  is also a play tool: clicking a pet calls `Pet.startTrick()` (a SPIN or ROLL with a hop
  and a `trickCooldown`; it returns `'wake'` for a dozing pet, `null` when scared or
  cooling down) and a successful trick pushes a coin bubble; clicking a coin bubble pays
  `PETS.coinPerBubble` straight into `COINS_KEY`, and the `TOY` button spawns a bouncing
  toy (`PETS.toyKinds`, 12 s life, two at once) that pets boop into flight for a
  `playful` mood; the `PHOTO` button pushes a postcard (`{ index, meals, pets, happy,
  stamp }`, capped at `postcardsMax` and persisted beside `meals` under `PETS_KEY`) and
  the `MEALS` button buys `PETS.mealPack` (250 snacks for 25 coins) while jumping
  `nextWave` past the purchase so packs never spawn waves. Moods render as emotes from
  `Pet.renderMood` (heart, angry brows, `Z`s, sparkles) and tastes live in
  `PETS.tastes`, filling a favorite critter to full hunger instead of
  `hungerRelief`.
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
  entry reads raw key codes from `Input.pressed` (letters/digits/Backspace, `Tab` cycles the
  active player's fish **costume** from `TAG.costumes`, `◀`/`▶` cycles its **color** from the
  shared `PALETTE`, Enter advances), CPU names come from
  `TAG.cpuNames` minus the player names, and the
  1760×990 world is rendered at a 960/1760 scale so the whole arena fits on screen.
  `TagSwimmer` handles the two players (co-op key sets) and CPU flee/chase steering —
  a CPU tagger chases a persistent random target (`pickRandomTarget`, re-rolled by
  `giveTagger`) rather than the nearest swimmer; it also counts `makes` (tags it landed) and
  `tags` (times it became IT), and `drawCostume()` paints its chosen original costume;
  tags transfer on contact with a cooldown and a separation push that shoves the newly
  tagged swimmer away from the original tagger, the tagger's name flashes, and the round
  clock decides the loser on the results panel. On the results, `recordTagMatch()` banks each
  name's best tags-made and fewest-times-IT into `sharkquarium.tagboard`, the panel names the
  match's best tagger/runner, and `TagBoardScene` (`tagboard`, reachable from that menu and the
  MINIGAMES row) lists the all-time leading taggers and runners.
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
- **Mutators** live on the base `Scene` (`src/engine/mutators.js` + `src/engine/scene.js`):
  `Game.applyPending()` calls `scene.setMutator(params.mutator)` before `enter`, and `Scene`
  exposes a `rules` accessor (`_baseRules` scaled by the active mutator via `scaleRules()`)
  plus `renderMutatorOverlay()` (darkness + HUD badge) that `Game.renderFrame()` draws after
  the scene. Because the accessor sits on the base `Scene`, every subclass — play tanks, all
  minigames, the horror arenas — honours mutators without per-scene wiring; scenes with
  bespoke enemy speeds (the horrors) multiply them by `this.mutator.knobs.enemySpeedScale`,
  and `Shark` steers off its instance `maxSpeed` so FAST can scale the diver.
  `MutatorsScene` (`mutators`) edits the persisted choice in `SETTINGS_KEY`.
- **Boss Rush** (`src/scenes/bossrush.js`) is a `MinigameScene` orchestrator: it instantiates
  fresh child scenes (`QuietScene`, `WatcherScene`, `MouthScene`, `TrenchExploreScene`,
  `PrehistoricScene`), assigns each `game`/`name`, sets `rushMode` (which suppresses the
  child's own rewards/records), calls `enter()` + `rushStart()`, then forwards `update`/`render`
  and watches `child.phase === 'results'` to advance or `game.pending` to abort. The
  `prehistoric` `bossOnly` param and the `trenchexplore` `rising` param skip straight to their
  bosses for the gauntlet.
- **Records** (`src/engine/records.js`) bank per-mode best time/score; `recordWin()` is called
  from the minigame base, the horror tanks, the Scene-based minigames, and play. `RecordsScene`
  (`records`) renders the board from `RECORD_GROUPS`, and `formatRecord()` stamps bests onto
  the tank and minigame lists. `src/engine/tagboard.js` keeps the parallel TAG board under
  `sharkquarium.tagboard` (`recordTagMatch()`, `topTaggers()`, `bestRunners()`), shown by
  `TagBoardScene`.
- **PlayToy Exploration** (`src/scenes/playtoy.js`, a `MinigameScene`) is a third-person
  scrolling wreck built from `PLAYTOY` config: bulkhead walls with vertical gaps (some
  sealed by typed `PLAYTOY_GATES`), anchor rings, `PLAYTOY_NOTES`, and `LivingToy` entities.
  Its **Anchor-Pack** is a scene-owned state machine (`idle → flying → haul/pullSelf →
  returning`) that aims from the pointer (or `firstPersonYaw` under `firstPersonMode()`),
  travels the head each step, and resolves against `tetherHit()` (targets, then walls).
  Rendering helpers live in `src/engine/tether.js`; the scene is listed in
  `FIRST_PERSON_SCENES` and exposes `firstPersonPalette/Bounds/Sprites`, so the existing
  raycaster renders it like the other tanks.

## 3. Game Loop and Timing

- Fixed timestep: `FIXED_STEP = 1/60`; frame time is clamped to
  `MAX_FRAME_TIME = 0.1` and fed to an accumulator. The loop runs at most `MAX_STEPS = 4`
  fixed steps per animation frame and drops the leftover time when it hits the cap, so a
  slow frame cannot cascade into a catch-up spiral (the simulation briefly slows rather
  than stuttering).
- Rendering happens once per animation frame after the fixed steps for that frame.
- The canvas backs at `min(devicePixelRatio, 1.5)` and is further capped to a 1920×1080
  backing store (`Game.resize()`), so high-DPI and 4K displays do not multiply the
  full-screen gradient fill cost. Drawing uses 960×540 logical coordinates and CSS scales
  the element. Resize is handled with `ResizeObserver` plus a window resize fallback.
- `engine/render.js` caches its per-frame gradients (keyed by the canvas backing size and
  palette) and font strings, so the full-screen water/light/vignette fills do not allocate
  new gradients every frame.

## 4. Input

- `Input` maps raw key codes to actions (`left`, `right`, `up`, `down`, `confirm`,
  `pause`, `back`, `hide`) via `DEFAULT_BINDINGS`, plus per-player movement sets
  (`left1`…`down2`). The `hide` action (`ShiftLeft`/`ShiftRight`) is a second trigger for
  the stingray's sand burrow and the squid's ledge-hole hide — both creatures OR it into
  their `wantsDown` check, so `Shift` buries/hides the same as `Down`/`S`.
- Co-op uses the per-player sets: P1 is `WASD`, P2 is the arrow keys, and pointer drag
  steers only P1.
- Pressed/released edges are cleared after each fixed step, so scenes read input edges
  exactly once.
- Pointer input is exposed as the virtual key `PointerPrimary` and as `input.pointer`
  (logical coordinates, `down`, and a `moved` flag that UI hover logic uses).
- Drag steering: while the pointer is held, `pointer.dragX`/`dragY` hold the offset from
  the press origin; the shark steers along that offset past `PLAYER.pointerDeadzone`.
- `POINTER_KEY` covers the primary press; `POINTER_SECONDARY` fires on right clicks
  (the canvas context menu is suppressed), used by the Pets Tank's critter feeding and as
  the Anchor-Pack's fire binding.
- Two PlayToy bindings joined `DEFAULT_BINDINGS`: `tool: ['KeyF', 'PointerSecondary']`
  (fire the Anchor-Pack) and `cycleAnchor: ['KeyE']` (swap its head).
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
  implemented once. Passing a `visible` count turns it into a scrolling window: it keeps
  the selected index on screen (`clampScroll`), tags each rendered `bounds` entry with its
  `index`, and draws caret hints when items sit above or below (used by the tank select).
- Both are canvas-drawn; there is no DOM UI, which keeps the single-file artifact
  simple.

## 6. Assets and Audio Pipeline

- The single-file contract forbids runtime requests, so images must be inlined as data
  URIs in `IMAGE_MANIFEST` and audio is synthesized.
- `loadImages(manifest)` resolves a keyed map of `HTMLImageElement`s. The scaffold's
  manifest is empty and all art is procedural canvas drawing.
- `AudioBus.tone({ freq, endFreq, type, duration, volume, delay, pan, reverb })` schedules
  oscillator envelopes, and `AudioBus.noise({ …filterFreq/filterEnd/q…, pan, reverb })`
  schedules filtered white-noise envelopes. The context is created lazily; `src/main.js`
  unlocks it on the first pointer or key event, and the bus disables itself if WebAudio is
  unavailable.
- **Spatial audio** — `pan` routes a voice through a `StereoPannerNode` (with
  `AudioBus.panFor(worldX, centerX, width)` to derive it), and `reverb` sends through a
  shared `ConvolverNode` with a synthesized decaying-noise impulse, so horror cues can sit
  left/right of the diver and bloom into the wreck.
- `AudioBus.setVolume(value)` scales the master bus (base gain 0.9) and
  `setSfxEnabled(flag)` mutes cues; `src/main.js` re-applies the persisted settings on
  startup.
- **Comfort + shared horror helpers** — `src/engine/motion.js` exports
  `motionScale()` (1, or 0 when the persisted `SETTINGS_KEY.reduceMotion` is on) so horror
  scenes can damp shake/zoom/flash, and `src/engine/horror.js` provides `renderDarkness()`,
  `renderConeLight()`, and angle helpers shared by the dark tanks.
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
  `{ coopTankSelect, difficulty, volume, sfx, mutator }`. Lifetime stats gain `minigames`
  and `minigameWins`, written by `recordMinigame()` in `src/engine/progress.js`, which also
  banks minigame coin rewards (30 + 60 win bonus), scaled by a module-level coin multiplier
  that `Game.applyPending()` sets from the active mutator (`setCoinMultiplier()`), so every
  minigame — including the bespoke Scene-based ones — pays the mutator bonus. Best times and
  scores persist per mode under `RECORDS_KEY` as `{ [mode]: { time, score, cleared } }`
  (written by `recordWin()` in `src/engine/records.js`). Shop progress persists under `SHOP_KEY`
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
FRENZY DOMINANCE), and
volume slider with persistence, co-op two-creature control, the empty tank clock
reaching game over, and the game over menu — failing on any runtime error. It also
covers the shop (coin banking with difficulty scaling, failed and successful purchases,
the SHADOW/RAINBOW specials with the attachable and removable aura rings, the ragdoll
plushie pack and the per-creature RGB neon jacket, HEAD/BODY slot trinkets with legacy
accessory
migration, the five trails, twenty-one companions, and the nine-aura slot, buying/wearing/removal
per slot, and all three
playpasses with their pass-granted cosmetics), the six paid arcade games (tickets charged
on every entry, refused when the purse is short, and kept out of the free games), the
pets tank (playerless left/right-click
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
