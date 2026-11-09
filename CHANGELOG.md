# Changelog

Notable changes to Sharkquarium, grouped into the contiguous days the work landed and
split into **game features** (player-facing content like tanks, creatures, modes,
screens, cosmetics, and progression) and **game systems** (the engine, rendering,
persistence, tuning frameworks, tooling, tests, and docs that support them). Each section
names the commits that carry the work.

## November 1, 2026 (latest)

The replayability pack (mutators, a boss rush, and a records/time-trial system), the
shared water realism pass, and the PlayToy Exploration tank with its Anchor-Pack tool and
lore inventory.

### Game features

- **Mutators** — a new MUTATORS screen (reachable from CHOOSE TANK and MINIGAMES) toggles
  one optional handicap across every dive and minigame: FAST, ONE HIT, NO AIR, LIGHTS OUT,
  GOLD RUSH, GLASS, and TIME PRESSURE. Each mutator hardens the run (enemy speed, clock,
  graces, darkness, lives) and pays back a coin and score multiplier; the active mutator
  shows a HUD badge on every run.
- **Boss rush** — a gauntlet (`MINIGAMES` entry, ticket fee) that chains all five horror
  bosses — the Echoeel, the Watcher, the Trench Mouth, the Megasquid, and the Titanoboa —
  wave by wave with a running clock, an interlude card per boss, and a bounty for each
  clear plus a full-clear bonus.
- **Records and time trials** — every tank, boss arena, and minigame banks a best time and
  score (new `src/engine/records.js` + `RECORDS_KEY`). A new RECORDS board cycles the
  tanks/bosses/minigames with a cleared count, and your best runs are stamped beside the
  tank-select and minigame entries; results screens announce NEW RECORD.
- **Prehistoric skip-to-boss** — the Titanoboa encounter can now be launched directly
  (`bossOnly`), used by the rush.
- **PlayToy Exploration** — a third-person standalone tank aboard the sunken cargo liner of
  the PlayToy Company, a maker of goofy fantasy sea-creature plush. Its flooded holds are
  full of **living toys** — button-eyed creatures (BUBBLE-FANG, WIBBLE, CRANK-FIN,
  GLOOP-LO) that wander and cling — and eight **lore notes** scattered through the wreck
  recount PlayToy's recipe for sparking a toy to life. Reach the surface hatch to win;
  collect the notes (and repel the toys) along the way. Collected papers persist between
  runs and can be re-read from a scrollable **PLAYTOY INVENTORY** panel (`I`/`Tab`, browse
  with Up/Down). The FIRST PERSON MODE switch still affects the tank like any other dive.
- **The Anchor-Pack** — the tank's tool: a wrist winch firing a barbed clamp on a line
  (fire with `F` or right-click). Three interchangeable heads swap with `E` — the **MAIN
  ANCHOR** hauls loot and swings you to rings, the **ELECTRICONDUCTOR ANCHOR** feeds live
  circuits and stuns toys, and the **PRESSURE ANCHOR** pries valves and heaves heavy wrecks.
  Typed gates require the matching head, and a head that finds only bare hull **bounces off**
  instead of pinning you to the wreck. Aim at a toy to knock, stun, or shove it off your back.
- **Christmas mode** — a SETTINGS switch that swaps the soundtrack for public-domain carols
  (Jingle Bells on the menu, plus Deck the Halls, Silent Night, We Wish You a Merry
  Christmas, Joy to the World, and Angels We Have Heard on High through the tanks; Twinkle
  Twinkle is deliberately excluded), turns the menu's rising ambient bubbles into **slow
  sinking snowflakes**, and puts **santa hats on every enemy and boss** (the morays' hats
  ride their heads and fade into the holes as they retreat). It also adds free festive
  cosmetics — a **SANTA HAT**, **REINDEER ANTLERS**, a **CARROT NOSE**, and the **SNOWFISH**
  dive buddy — and a **MERRY CHRISTMAS** cutscene-trailer greeting that closes on
  “SHARKQUARIUM WISHES YOU A MERRY CHRISTMAS!”.
- **Halloween mode** — a second seasonal switch: an eerie original score (Haunted Drift on
  the menu, plus Witches Waltz, Midnight Hunt, and Graveyard Bells), drifting autumn leaves
  instead of menu bubbles, **witch hats** on every enemy and boss, a **WITCH HAT**,
  **PUMPKIN HEAD**, and **GHOST FISH** buddy in the wardrobe, and a **HAPPY HALLOWEEN**
  theatre trailer.
- **New Year mode** — a third seasonal switch: a party score (Auld Lang Syne on the menu,
  plus Firework Finale and Countdown Party), falling confetti instead of menu bubbles,
  **party hats** on every enemy and boss, **NEW YEAR GLASSES** and a **FIREWORK FISH** buddy
  in the wardrobe, and a **HAPPY NEW YEAR** theatre trailer.
- **8-bit mode** — a SETTINGS switch that renders the whole game to a tiny 256×144 buffer and
  blows it up with hard nearest-neighbour pixels plus CRT scanlines (blocky text in a
  monospace pixel font, chunky creatures, no smoothing, no glow blur) and turns the audio
  chiptune: warm square-wave pulse tones with a soft envelope, gentle noise-percussion hats,
  a lightly band-limited master, and a soft bit-crusher — retro without the earache.
- **Season controls** — the three modes are mutually exclusive and the **top-right corner
  names the song currently playing**; switching a season swaps the track already playing
  immediately.
- **Carol accuracy pass** — the seasonal melodies were re-sequenced to follow the real tunes
  more closely (Silent Night in proper 3/4, Joy to the World's descending scale and rising
  answer, Angels We Have Heard on High, and Auld Lang Syne), leaving Jingle Bells as-is.
- **REEF RUSH** — an original rhythm-runner minigame (its own name, art, music, and course —
  not a Geometry Dash clone). The reef auto-scrolls and one left-click jumps; cone-shaped
  **shells** are spikes (resizable per placement) and cube-shaped **rocks** are landable
  blocks, all placed on the beat of a new original track. It plays an **original
  hand-authored course** in the classic rhythm-runner pacing (intro → single jumps → stair
  runs → tighter block-and-shell combos), with spacing clamped so it is always clearable.
  Collect pearls and reach the distance marker; difficulty renames the tiers
  CALM / CHOPPY / RIPTIDE / MAELSTROM. Costs 40 sea coins.
- **REEF RUSH — MY TRACK** — play your saved composer song as a level: its drum hits become
  shell spikes, bass notes become rock blocks (sometimes a two-high stack), and synth/piano
  notes become pearls, laid out on the beat over three loops, with hanging ceiling hazards on
  synth beats. The course is **built to be clearable but lively** — chords collapse to one
  spike/block, every obstacle is capped at a jumpable height, consecutive ground obstacles are
  kept at least a jump apart, and the gaps rotate through **gamemode devices** (a portal of a
  random swimmer, a floating ledge, a thrust bubble pad, or a gravity bubble). Reached from
  the TRACK PLAYER's **RUSH MY TRACK** and the MINIGAMES menu; it banks its own
  **REEF RUSH — MY TRACK** record.
- **REEF RUSH — LEVELS & hazards** — a **sideways-scrolling** shelf of **original hand-built
  courses** (Left/Right to scroll, Enter to play). Clearing one plays an **end cutscene**
  (bubbles, confetti, level name, time, pearls) and, on the **first clear, unlocks a free
  skin** — the more levels beaten, the more skins unlocked. The original levels are mode
  showcases: SUNLIT REEF (fish shell jumps), KELP CROSSING (dart eel — tight weed/rock gates),
  STINGRAY ALLEY and JELLY BLOOM (pillars of ceiling rocks + rocks with a hole to thread), and
  DEEP CURRENT (urchin pillars then a crab run of ceiling shells and shells with gaps, via
  portals). REEF RUSH's hazards and pickups are
  now **SHELL** and **SEAWEED** (ground spikes) plus matching **CEILING SHELL** and **CEILING
  WEED** (hanging spikes), floor **ROCK** and hanging **CEILING ROCK**
  (both stackable blocks), **PEARL** (collectible), the **PRESSURE BUBBLE** — an air pickup that
  grants a free jump-boost when you click while touching it, even in mid-water, with a generous
  hitbox — and the **GRAVITY BUBBLE**, which **turns gravity upside-down in whatever mode you
  are in** (a second one keeps you upside-down), the **GRAVITY BUBBLE PAD** / **CEILING GRAVITY
  BUBBLE PAD** that flip gravity on **mere touch** until another pad is touched, and the
  **THRUST BUBBLE PAD** / **CEILING THRUST BUBBLE PAD** — rhythm-runner jump pads that fire an
  automatic extra jump away from their surface when you touch them — the **FLOATING LEDGE**,
  a thin standable slab you can hang at any height from just above the floor to just under the
  roof, and the **SLOPE UP** / **SLOPE DOWN** ramps that carry the swimmer up and down. The
  stingray, jelly, eel, and urchin are no longer hazards: they are portal **swimmer modes** only.
- **REEF RUSH — swimmer modes** — the portal targets now play distinctly: a **FISH** portal
  turns a transformed player back into the plain fish, **STINGRAY**
  (hold to fly), **DART EEL** (the Nautilus Tank's dart-eel head on a body painted with the
  moray eel's own trail renderer, so the tail trails behind along the path it has swum; hold to
  climb, a short click makes a small zig, and it dives back down on its own), **CRAB** (each
  click flips gravity, snapping to the nearest landable surface — floor, ceiling, rock, or
  floating ledge), **URCHIN** (like the crab but it drifts instead of snapping), and **JELLY**
  (tap to hop, no holding — sinks back, so spam to hover). The HUD names the current mode; the
  stingray is drawn smaller and uses the game's spotted-ray model/skin.
- **REEF RUSH — COURSE BUILDER (expanded)** — the editor now shows a **vertical scroll-down
  item list on the right** of the track: scroll it with `Q`/`E` or the **mouse wheel** (or click
  a row, or press `1`–`0` to jump to a row). It lists the pieces (SHELL / SEAWEED / CEILING
  SHELL / CEILING WEED / ROCK / CEILING ROCK / PEARL / PRESSURE BUBBLE / GRAVITY BUBBLE /
  GRAVITY BUBBLE PAD / CEILING GRAVITY BUBBLE PAD / THRUST BUBBLE PAD / CEILING THRUST BUBBLE
  PAD / FLOATING LEDGE / SLOPE UP / SLOPE DOWN) then
  the modes (STINGRAY / DART EEL / CRAB / URCHIN / JELLY / FISH, each placing a portal with that
  target). **Click a rock or ceiling rock again to stack
  it**, **hold + drag up/down to resize a piece**, **drop a shell/ceiling shell or a bubble pad
  over a rock, ceiling rock, or floating ledge to rest it on top**, and remove with `X`. **TEST**
  launches the course from the start and **TEST HERE** (`T`) launches it from the cursor, standing
  the fish on the nearest landable surface there, so you
  can try any stretch; crashing during a test offers **BACK TO BUILDING** on the results screen (Esc returns to the
  editor too). Courses save to
  `RUSH_BUILDER_KEY` and run as
  **REEF RUSH — MY COURSE** with their own record. No third-party level data is included —
  every course is player-authored.
- **Tag leaderboard & fish costumes** — TAG now tracks **tags made** and **times IT** per
  swimmer, names the match's **BEST TAGGER** (most tags) and **BEST RUNNER** (least times IT),
  and banks both in a persistent **TAG LEADERBOARD** (a new screen reachable from the MINIGAMES
  menu and the TAG results). Players also pick a **costume** and a **color** for their tag fish on
  the name screen (`Tab` cycles the costume, `◀`/`▶` cycles the color) — original looks like
  CHAIN-FIN (a fish with a chainsaw snout — rounded, toothed tip — and top handle, a rear handle overlapping its
  own tail fin, fangs, and an eye vent in the player's color whose black slits reveal a smaller
  glowing yellow eye), DEVIL FISH, FANG FISH, CYBER FIN, ANGEL FIN, LANTERN FISH,
  SPOOK FIN, **CRIMSON MANE** (red horns and mane), **TOPKNOT**, and **FALLEN ANGEL** (wings and
  a halo) — no third-party characters are used.
- **Ragdoll ripcord** — a new BODY trinket (**RIP CORD**, 160 coins) plus a CHAIN-FIN add-on: a verlet-physics starter cord with a pull-handle that lags and swings with the swimmer's motion.
- **EMOTES** — a new shop shelf of cheap (≤15 sea coins) one-shot performances. Equipping one demos it on the preview and pressing **V** in any dive plays it on your creature. Includes **CHAIN-FIN TRANSFORM** (the creature reaches a fin/tentacle to the rip cord on its tummy, yanks it so the chain-fin visor slides on horizontally, then after three seconds yanks it again to revert), **SPIN BARREL ROLL**, **BOOP**, **TAIL WIGGLE**, and **BUBBLE BLOW**; all work on every dive creature and tag swimmers.
- **AI CHAT (CPU)** — a new MINIGAMES screen where you chat with **NOVA**, the CPU you dive with. Type with the keyboard; your messages appear right in light-blue bubbles with gray text and NOVA replies left in yellow bubbles with black text, both in the game font over the navy Sharkquarium water. NOVA answers greetings, small talk, and questions about tag, Reef Rush, the spooky tanks, and the shop using original lines (no external service).
- **FRENZY DOMINANCE difficulty** — a new top difficulty tier far beyond APOCALYPTIC WIPEOUT:
  4.5× enemy speed, 0.15 spawn interval, 5× score penalty, 0.15 grace, 0.35× tank clocks,
  a 15 s ramp, five extra hazard slots, an ×8 coin multiplier and an REEF RUSH 2.2× speed /
  0.35 gap / 1.25× spike scale.
- **Christmas-exclusive minigames** — two seasonal games appear in MINIGAMES only while
  CHRISTMAS MODE is on, both set in a **flooded cruise-shipwreck lounge** (wood panelling,
  portholes, armchairs, a rug, a chandelier, and a fireplace full of glowing **bioluminescent
  squids instead of fire**) with the player rendered as their **current shark, skin, and
  wardrobe**. **WRAP THE PRESENTS**: **ten presents are hidden in unexpected places** around the
  lounge (inside the fireplace among the squids, behind the armchairs, under the table, by the
  portholes, in the corners), only fading into view very close up; swim with WASD, take one with
  E, then hold left-click and sweep the cursor to wrap it, ticking a two-column top-right
  checklist (tick box + present picture) before a slow timer runs out. **SANTA'S NET**: you sleep as your
  shark under a draped net bag of **sixteen** gifts scattered through it, watched by a **fast** camera; presents stay hidden
  until you peek, and holding E fills a peek meter that **closes your eyes when it is near
  full** (releasing also closes them), so you peek in short bursts. Click the wishlist slate to
  study **four** wished shapes, then click the **eight** matching presents to sneak them out
  while dodging the camera — the net is full of **near-identical flawed decoys** (a short-pointed
  star, lopsided heart, skewed triangle) that are refused.
- **Halloween & New Year exclusive minigames** — two games each, shown in MINIGAMES only in
  their mode, with the seasonal room backdrops in `src/engine/seasonroom.js`. **HALLOWEEN —
  JACK-O'-LANTERN HUNT**: a dark crypt; swim with WASD and E/click to light eight jack-o'-lanterns
  while ghost jellies snuff your light. **SPECTRE SWEEP**: click 12 rising spectres to banish
  them; escaped spectres or clicking the friendly ghostfish cost a strike. **NEW YEAR —
  MIDNIGHT FIREWORKS**: click to launch rockets and click again to burst them in a glowing band,
  chaining combos for 10 hits. **CONFETTI RUSH**: an auto-swim dash steering your shark to
  collect 25 stars while dodging party poppers.
- **Scrolling minigame menu** — the MINIGAMES list now uses a fixed 15-row window that scrolls
  with the arrow keys **and the mouse wheel** (`SelectList` gained an opt-in `wheel` option), with
  fee/record labels following the scroll.
- **Track builder** — a four-track sequencer reached from the TRACK PLAYER with **DRUMS /
  BASS / SYNTH / PIANO tabs** over a **piano-roll surface of horizontal lines** (no grid).
  Clicking a line places a tone block (higher lines = higher notes, stackable into chords),
  **left-clicking and dragging right stretches a block longer** (a tap removes one), blocks
  on the other tracks show through as **colored outlines** at the same step and height, the
  arrow keys slide the script side to side, PLAY loops it with a sweeping playhead,
  CLEAR empties the current track, tempo is adjustable, **L+ / L- stretch the script longer or
  shorter (8–128 steps)**, and the song saves itself. The saved
  song is a **playable track in the TRACK PLAYER** (**MY TRACK** plays/stops it, **EDIT MY
  TRACK** reopens the builder). The menu music goes silent while the builder is open and is
  restored on exit.
- **Snowflake aura** — a new shop aura that rings the diver with orbiting six-pointed snow
  crystals, a faint icy halo, and drifting sparkles (rainbow-aware like the other auras).
- **Scrolling tank select** — the tank list is long enough to overflow the screen, so it now
  renders in a fixed 11-row window that scrolls (with up/down caret hints) to keep the
  highlighted tank visible; the per-tank best-time badges scroll with it. The reusable
  `SelectList` gained this optional `visible` window.

### Game systems

- **Shared mutator framework** — `src/engine/mutators.js` defines the mutator list and
  `scaleRules()`; `Scene` now owns the mutator lifecycle (`setMutator`, a rules accessor
  that scales difficulty, and a `renderMutatorOverlay` drawing the darkness and badge), so
  any scene — play tanks, all minigames, and the horror tanks — honours mutators uniformly.
  `recordMinigame()` applies a global coin multiplier set on scene entry, so even the
  bespoke minigames pay the bonus.
- **Boss-rush orchestrator** — `src/scenes/bossrush.js` instantiates and drives fresh child
  scenes, detecting their `results` phase to advance and their scene-change requests to
  abort, with `rushMode` guarding each boss from double-recording.
- **Records plumbing** — `recordWin()`/`formatTime()` in `src/engine/records.js`, win hooks
  in the minigame base, the horror tanks, the Scene-based minigames, and play, plus
  `MODE_LABELS`/`RECORD_GROUPS`/`SOLO_VARIANT_SCENES` in `src/config.js`.
- **Scaling seams** — `Shark` now steers off its instance `maxSpeed` (so mutators can scale
  the diver), and the horror bosses scale their chase/suction/stalk speeds by the mutator's
  enemy multiplier.
- **PlayToy systems** — `src/engine/tether.js` draws the sagging line, barbed clamp head,
  and first-person reticle; `src/entities/livingtoy.js` is the wander/chase/stun/knock
  plush entity; `src/scenes/playtoy.js` builds the scrolling wreck (bulkheads, typed gates,
  anchor rings, notes, machinery) with a camera follow, HUD, inventory, and first-person
  hooks. `src/config.js` adds `ANCHOR_TYPES`, `PLAYTOY`, `PLAYTOY_GATES`, `PLAYTOY_NOTES`,
  `PLAYTOY_TOYS`, and `PLAYTOY_KEY`, and `src/engine/input.js` adds `tool`, `cycleAnchor`,
  and `inventory` bindings.
- **Seasonal music, particles, hats, and trailers** — `src/assets/tracks.js` adds themed
  tracks (carols, eerie originals, and party tunes) with titles and a per-season
  `SEASON_TRACKS` map; new `src/engine/season.js` owns `setSeason()`/`resolveSeasonTrack()`
  and `src/engine/music.js` uses it (keeping the non-seasonal base track in `source`) so
  `MusicPlayer.play()`/`refresh()` transparently substitute the theme and re-resolve the
  track already playing. `Game.renderFrame()` draws the `NOW PLAYING · <title>` label.
  `src/entities/snowflake.js` renders snow/leaf/confetti particles the menu spawns instead
  of bubbles, `Entity` overlays the season's hat on `santa`-flagged enemies, the wardrobe
  gains each season's accessories/companion, and `src/scenes/christmastrail.js` plays the
  holiday trailer for whichever season is requested. Applied on boot from settings and by
  the SETTINGS switches.
- **8-bit rendering and audio** — new `src/engine/retro.js` holds the flag;
  `Game.renderFrame()` renders scenes into a 256×144 offscreen canvas and upscales it with
  smoothing off plus scanlines, `drawText()` switches to a monospace pixel font without glow,
  and `AudioBus` runs its master through a gentle low-pass filter and bit-crusher while
  `tone()` uses a warm square periodic pulse with a soft envelope and `MusicPlayer` adds
  gentle noise-percussion hats.
- **Settings layout fix** — the SETTINGS screen now shows a single description line for the
  selected row and a lower, tighter list, so the caption text no longer overlaps the menu
  options.
- **Smoother, lighter rendering** — the canvas backing store is capped (device pixel ratio
  1.5 and at most 1920×1080) so large/high-DPI displays stop burning fill-rate; the fixed
  step catch-up is capped at four steps with leftover time dropped to avoid spiral stalls;
  and the shared water gradients plus text font strings are cached instead of rebuilt every
  frame.
- **Christmas music toggle fix** — `MusicPlayer` keeps the base (non-seasonal) track in
  `source`, ignores resolved seasonal tracks when they are passed back in, and clears
  `source` on `stop()`; scene restores capture `source`. Turning Christmas off now always
  restores the normal theme, even after the Christmas trailer or any dive that had been
  playing the resolved Jingle Bells track.
- **Tests and docs** — smoke coverage for the mutator screen, rules scaling, records
  persistence, a full five-wave boss-rush clear, and the PlayToy tank (world build, note
  persistence + inventory, head-to-gate matching, wall bounce, exit win, first person); LORE
  gains PLAYTOY EXPLORATION, THE ANCHOR-PACK, LIVING TOYS, THE ANCHOR SWITCH, MUTATORS, BOSS
  RUSH, and RECORDS.

## October 30, 2026

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
- **Floor-stub morays** — the labyrinth's floor stubs sprout a scatter of tiny moray
  holes; a diver who lingers over one gets a moray rearing up to bite with the REEF
  CLEANUP peek/bite/retreat in the stingray tank's moray colors, staggering them a beat.
- **Upright facing** — playable creatures no longer rotate to their heading; they stay
  upright and mirror to face their swim direction, so heading left faces left instead of
  flipping the sprite upside down.
- **Shift to hide** — `Shift` is now a second bind for hiding: it buries the stingray in
  the sand and tucks the squid into a ledge hole, exactly like `Down`/`S`.
- **3D MODE** — a SETTINGS switch renders the whole game in 3D: every enemy, bubble, prop,
  and the player is drawn as a shaded extruded volume with a ground shadow (bubbles as lit
  spheres), each scene's background becomes a perspective sky and grid floor, and the
  canvas tilts onto a perspective plane; the toggle persists and re-applies on boot.
- **ABYSS TRENCH TANK** — a new three-phase boss tank on the tank select: a leviathan that
  hunts, telegraphs, and lunges, exposes its glowing eye only while staggered, escalates at
  1/3 and 2/3 health with faster lunges and summoned trenchlings, and is beaten in twelve
  ramming hits across three lives. The leviathan is navy blue with glowing cyan dots lining
  its tentacles and tail and a big bright-blue eye whose white circular pupil follows
  the nearest diver (flanked by two smaller eyes, all blinking), and its trenchlings are
  navy-blue with glowing dots and one giant leviathan eye.
- **REEF SWARM QUEEN** — a second boss tank: a hovering queen that summons homing
  swarmlings or telegraphs a charge, then opens its glowing core to be rammed; pop the
  swarmlings to stay clear, and beat it across three lives and three phases.
- **MYSTERIOUSLY QUIET TANK** — a horror stealth tank set in an abandoned
  underwater research lab the alien attacked, laid out in scrolling labyrinth-style
  sections with checkpoint masts, opened by a diver picker and an arrival cutscene where an
  intergalactic atom rift tears open in the lab and the ECHOEEL comes through it
  (its planet ran out of prey) as the seven divers arrive: a really
  dark-grey, finless, eyeless ECHOEEL whose armored
  head hinges open from its teeth to the top (revealing the dark inside of its mouth) drifts in the background and only
  hears you — bumping clutter makes noise that
  draws it in at unoutswimmable speed and it lunges at and shatters that junk (blind, it
  thinks you're there) even while the diver hides, and it never homes on or diverts to the
  diver: it takes you only if you are still beside that junk — and not hidden or behind a
  bulkhead — when it strikes, if you drift right up against it in the open, or if its
  expanding echolocation sweep catches you in the open (hide alcoves and bulkheads block
  the ping), while
  holding a full noise meter for over two seconds
  triggers a jumpscare whose head splits apart to bare its needle teeth;
  reach the exit hatch to escape. The tank swaps the menu lullaby for its own slow
  **horror D-tritone drone at 64 BPM** (a new selectable QUIET TRACK) and restores the
  held theme on the way out.
- **QUIET TANK HORROR PASS** — the lab goes **near-black**: only a small flickering pool
  of light follows the diver, so the corridor and its scatter are invisible while the
  **ECHOEEL stays fully visible** gliding out of the dark. A **proximity heartbeat**
  quickens as it nears and **ambient rumble, metal groans, creaks, water drips, and radio
  static** fill the silence; **claw marks** score the bulkheads, the **crew's empty dive
  suits** drift in the dark, and the jumpscare gains **variants** (a sonar catch, an
  instant snap, a lunge, and a drawn-out breach) behind a short dread beat.
- **QUIET TANK PHASE 2** — the horror deepens: the light **tightens as the echoeel nears**
  (and as your noise rises), and **swimming fast now makes noise**; **steam vents** erupt
  and lure it, **bulkhead doors slam shut behind you**, the **remains of the six scientists
  who crewed the lab** turn up one by one (each with a final log line), the dark conjures
  **false echoeels** that dissolve, and its end-of-run chase is gone (that now lives in
  **THE ESCAPE**). In the last **four bulkheads** the echoeel makes a **scripted near-miss
  lunge** (charging straight at the diver, held just out of reach) so the diver slips
  through the hatch a heartbeat before it lands. Its jaw now **unhinges
  unnaturally wide** — the lower jaw drops and the upper folds back, the teeth elongating
  over a stretched black gullet. The tank also opts into
  **FIRST PERSON MODE** as a tight, fogged raycast dive.
- **THE ESCAPE TANK** — the quiet lab's climax is now its **own standalone tank**:
  pick a diver and the lab is already collapsing with the **ECHOEEL awake and relentless**
  from the first second (`phase2` on). It is a **winnable straight sprint**: the shade
  pursues at `QUIET.part2Speed` (slower than a clean diver) so you outrun it by keeping
  moving, while **ceiling debris** telegraphs then crashes into your path as blocking
  rubble and every dodge costs ground, with two checkpoint masts and the same near-black
  light, dread drone, jumpscare variants, and first-person raycast. Reaching the exit plays
  an **escape cutscene**: the ECHOEEL **slams into a pane of glass**, the pane **shatters**,
  and its **high speed combined with its weight sinks it into the trench**. The quiet tank
  itself now ends at its hatch.
- **THE WATCHER TANK** — a **look-away** horror tank with a redesigned monster: a lumpy,
  barbed creeper crowned by a huge bloodshot **slit-pupiled eye** (glowing when it stalks,
  glassy and locked on you when petrified) ringed by smaller blinking eyes over a
  needle-toothed maw that gapes as it closes, all writhing on its tendrils: your **gaze is the only light** (a
  beam aimed with the mouse, or the camera in **FIRST PERSON MODE**). Big single-eyed
  **WATCHERS** **petrify inside the beam** and **only crawl toward you when you look
  away**; a **STARE meter** forces a **blink** that kills the light and lets them **surge**.
  Four sectors field more and faster watchers, **checkpoint masts** respawn you on a catch,
  and the finale is a **GREAT EYE** to hold in the beam while you reach the hatch.
- **THE TRENCH MOUTH TANK** — the **anchor-against-the-gulp** horror tank: the trench
  **floor is one colossal maw** that rests, rumbles, **inhales** (dragging the diver toward
  the jaws), and **snaps**. Ceiling **anchors** are the only grip — hold **`SPACE`** to
  **brace** so the suction can't move you, release to advance, and re-grip before each
  gulp. Stronger/longer gulps and sparser holds per section, **checkpoint masts** on a
  swallow, coin bubbles to clear each stretch, and a first-person fogged raycast.
- **PREHISTORIC TANK** — a new chase tank where you play a **lungfish** fleeing through
  three thirds of deep time: the **Devonian sea** (swim from a **DUNKLEOSTEUS** while
  dodging **ammonites** that knock you back but **distract** the armored fish when it hits
  one), a **swamp** (run on your fins from a lunging **VELOCIRAPTOR**, diving through water
  pools it won't enter), and the **highlands**, which open on a cutscene of the **TITANOBOA
  coiled in a tree, slowly moving** before the giant snake drops and chases you across land
  and water on a **long, fixed-length body**. Checkpoint masts and a three-part progress bar pace the run.
- **QUIET TANK CHECKPOINTS** — a lit **checkpoint mast** at each sector start banks your
  progress; if the ECHOEEL catches you, the jumpscare plays and you **respawn at the last
  mast** (noise cleared, the echoeel sent away, seals and debris reset) instead of losing
  the run. The HUD tracks `CHECKPOINTS n/3`.
- **TRENCH EXPLORE MINIGAME** — a new **timeless** buoyancy minigame: `SPACE` kicks you
  up while you sink under your own weight, so you hover and dive a vertical trench
  gathering **sea coin bubbles**. A **fishing boat and net** sit on the surface — the
  winch rattles, the net **drops**, and you must **sink beneath its reach** until it
  retracts. Grab every bubble to clear a trench and move on; each trench reaches **deeper**
  with a faster net. Clear all four and the **MEGASQUID rises from the last trench**
  (tentacles tangled in a shipwreck that it **tears apart**), then a **thrilling boss chase**: the dive
  becomes a **rightward run** with **fishing nets hanging from the surface** to swim under,
  and you **round the drifting fish schools into a net to bait it** — the bait **lures the
  megasquid** in and the net **deals damage**, each hit stunning it while its **health bar**
  drains (it rages as it drops). Deplete its health to **drive it off and escape**. Charges a 50-coin ticket.
- **TRENCH EXPLORE LIFE + CATCHABLE RAYS** — the trench now teems with cosmetics: cruising
  **morays**, swaying **seaweed**, floor **crabs** that bolt when the diver nears, and
  **octopus**/**squid** coral per trench. A whole **rainbow of stingrays** drifts it — spotted
  (dark yellow, bright blue spots, orange-ringed dark blue tail), plain gray, tiger, blue,
  green, violet, crimson, sunset, mint, gold, silver, pink, cyan, copper, and night, plus
  translucent **baby rays** with one big spot (pink, blue, green, yellow, or purple). Herd a
  ray into the descending net to **scoop it up** and unlock its **free shop skin** (twenty
  ray colors in all). The floor **crabs** now **burrow under the sand when cornered** at a
  trench edge and **resurface when the diver is far enough**. The floor is now **solid** (no clipping) and coin bubbles got **roomier
  hitboxes**.
- **CUTSCENES IN THE THEATRE** — two new finale cutscenes are replayable from the
  CUTSCENE THEATRE: **THE ESCAPE** (the flooded-lab glass-shatter finale, where the
  ECHOEEL slams into the pane and sinks toward the trench) and **THE RISING** (Trench
  Explore's megasquid hauling itself out of the last trench to tear a wreck apart).
- **RAYCAST TANK** — a new first-person novelty tank: a Canvas2D software raycaster over a
  procedurally generated wreck maze with distance-shaded walls, a licking cone, and a
  minimap; collect every bubble then reach the exit light.
- **FIRST PERSON MODE** — a SETTINGS switch below 3D MODE renders every dive and minigame
  as a first-person **raycast** view from the selected creature: a software raycaster of a
  3D room built from the level's walls, with depth-sorted billboards for the enemies,
  bubbles, and props; the mode goes fullscreen and pointer-locks so the mouse looks
  endlessly without edge-sticking, the diver's own body and the cursor are hidden, `W`/`S`
  move forward/back and `A`/`D` strafe relative to the view (never swinging the camera), a
  corner minimap shows the arena. It
  works independently of 3D MODE and persists. (Also fixes a hang
  when first person and 3D MODE were both on entering the labyrinth.)

### Game systems

- **Filtered noise on the audio bus** — `AudioBus` gained `noise()` (a cached white-noise
  buffer through a `BiquadFilter`/gain envelope) so scenes can layer rumble, creaks, drips,
  static, and other non-tonal horror sound; it stays silent when there is no `AudioContext`.
- **Raycaster scene overrides** — `renderFirstPersonLevel()` now honors per-scene
  `firstPersonRange`/`firstPersonFog`/`firstPersonShadeFloor` and an optional
  `firstPersonMinimap: false`, so a scene can render a much tighter, darker view.
- **Spatial audio + comfort** — the bus gained `pan` (a `StereoPannerNode` with a
  `panFor()` helper) and `reverb` (a shared `ConvolverNode` with a synthesized impulse),
  so horror cues can sit left/right of the diver and bloom into the wreck; a new
  `src/engine/motion.js` `motionScale()` and a persisted **REDUCE MOTION** setting damp the
  horror tanks' shake/zoom/flash; `src/engine/horror.js` shares `renderDarkness()` /
  `renderConeLight()` across the dark tanks.
- **Quiet-tank cosmetics fix** — the MYSTERIOUSLY QUIET scene never advanced the shared
  skin clock during play, so a diver's karambit aura and shadow-skin pulse rendered
  frozen; it now ticks `setSkinClock()` every frame like the other scenes.
- **Shared water realism pass** — `drawWater` (used by every play tank, the abyss and swarm-queen arenas, and the horror tanks) now layers a light-from-above gradient, a shimmering surface band, five pulsing god rays, animated caustics, and floating motes over the strengthened vignette; a new `drawDepthFish()` adds faint drifting background silhouettes (wired into the play tanks with a floor haze), and the abyss and swarm-queen arenas gained glow-vent/coral backdrops.
- **Lore codex update** — the in-game LORE codex gained entries for THE ESCAPE, THE
  WATCHER, THE TRENCH MOUTH, and the PREHISTORIC TANK, the WATCHER / AMMONITE /
  DUNKLEOSTEUS / VELOCIRAPTOR / TITANOBOA hazards, the TRENCH EXPLORE minigame, and a new
  THE MODES section (3D MODE, FIRST PERSON MODE, REDUCE MOTION, costumes & the karambit).
- **Tests and docs** — the smoke suite grew the ceiling-stub, ending-beat, costume,
  moray-hole, and trench-gap checks (about 14k animation frames), and the docs were kept
  in sync.

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
