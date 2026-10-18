# Sharkquarium — Feature Requirements

This document tracks the game-specific requirements: lore, navigation, controls,
entities, scoring, HUD/feedback, and art/audio direction. It describes **what the game
is and must do**; how it is built lives in `GAME_DESIGN.md`. Tuning values referenced
here are implemented in `src/config.js` and must stay in sync with this file.

Status: the scaffold currently implements the starter concept below. Replace or extend
these requirements as the design evolves.

## 1. Lore and Setting

The aquarium has closed for the night: the last visitors are gone, the hall lights are
dimming, and the tank is settling into its quiet blue dark.

- The player is a young resident shark sneaking in one last lap before lights-out.
- Bubbles are stray air puffs from the filter pumps. Popping one is satisfying and buys
  the shark a moment more.
- Jellyfish are grumpy night drifters. Brushing one stings and costs time.
- At 60 points the tank teleports the player into the Stingray Tank: a sand-floored
  arena with a rock archway where a pack of eels lurks in five holes, peeking before
  they swarm out to hunt.
- At 250 points the run is pulled deeper into the Deep Sea Tank: a lightless arena with
  two stone ledges full of hiding holes, roaming anglerfish, and crabs raining from the
  surface.
- After 40 bubbles collected in the Deep Sea Tank, the run surfaces into the Arctic
  Tank: a grey shrimp riding sardine schools under the watch of two ice-perched seals,
  with plankton drifting past.
- After 30 plankton collected there, the run is pulled into the Jelly Tank: the player
  is a jellyfish tangling minnows while dodging a charging turtle miniboss.
- Clearing the Jelly Tank drops the run into the Freshwater Tank: a scrolling river
  chase where a freshwater stingray outruns a giant catfish through logs, rocks, plants,
  and piranha schools.
- When the clock hits zero the lights go out and the lap ends.

Tone: calm, cozy, friendly. No gore; the clock is the only pressure.

## 2. Core Loop and Session

1. A dive starts with 30 seconds on the clock.
2. Collect a bubble: +1 score and +1.25 seconds.
3. Bump a jellyfish: −3 seconds, knockback, and 1.2 seconds of blinking invulnerability.
4. At zero: show the score, persist a new best, and offer another dive.
5. At 60 points the dive is teleported into the Stingray Tank, where score and timer
   carry over and the eel hunt begins (§5.7–5.9).
6. At 250 points the Stingray Tank teleports into the Deep Sea Tank, where the player
   becomes a squid hiding in ledge holes from roaming anglerfish (§5.11–5.14).
7. Collect 40 bubbles in the Deep Sea Tank to be teleported into the Arctic Tank, where
   the shrimp hides inside sardine schools from the seals (§5.15–5.19).
8. Collect 30 plankton in the Arctic Tank to enter the Jelly Tank miniboss, where the
   jellyfish tangles minnows for points and stuns the turtle by ramming its head
   (§5.20–5.22); 10 points opens the freshwater chase.
9. Clearing the Jelly Tank drops the run into the Freshwater Tank chase: an
   auto-scrolling river where the ray outruns a giant catfish (§5.23–5.26).

Chaining bubbles extends the run, so difficulty is player-driven rather than scripted.
The tank also gets busier over time: spawn rates ramp up and jellyfish grow more
numerous during the first minute (§6). Session length is about one minute, longer for
strong runs that descend through the tanks.

## 3. Navigation and Screens

Flow: `boot → menu → play ⇄ pause → game over → play or menu`

Requirements:

- Every screen is fully operable with the keyboard alone; mouse hover and click are
  convenience layers, never required.
- Selection lists wrap around, play a blip when the selection moves, and confirm with
  Enter, Space, or a click.
- `Esc` resumes from pause and closes overlays; `Esc` on game over returns to the menu.
- Touch play is fully supported: drag anywhere on the tank to steer and tap the
  on-screen pause button.
- Tanks are not menu options: the run teleports mid-dive through the reef, Stingray,
  Deep Sea, Arctic, Jelly, and Freshwater tanks as its challenges are met (§6).
- CHOOSE TANK opens the tank select, where any tank — and the empty-tank test mode — can
  be started directly with an optional co-op toggle. A chosen tank starts with a fresh
  score and continues the normal chain from there.
- SETTINGS holds the `CO-OP TANK SELECT` switch, the `DIFFICULTY` selector
  (EASY / NORMAL / HARD), the `VOLUME` slider (stepped in 10% steps; `Left`/`Right`
  adjust, clicking the track sets it), and the `SFX` switch. When co-op tank select is
  ON, the tank select starts with co-op enabled (still adjustable per visit), so players
  can run co-op dives in any tank. Preferences persist under `sharkquarium.settings`.
- The main menu shows the story blurb (§1, condensed) above the options list.

| Screen        | Options                              | Behavior                                                              |
| ------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Boot          | —                                    | Loads the asset manifest, then hands off to the menu                  |
| Main menu     | START DIVE, CHOOSE TANK, CO-OP DIVE (2P), SETTINGS, HOW TO PLAY | Story blurb above the list; HOW TO PLAY opens an overlay closed with Enter or Esc |
| Tank select   | CO-OP: OFF/ON, REEF TANK, STINGRAY TANK, DEEP SEA TANK, ARCTIC TANK, JELLY TANK, FRESHWATER TANK, EMPTY TANK, BACK | ESC or BACK returns to the menu; choosing a tank starts it immediately |
| Settings      | CO-OP TANK SELECT switch, DIFFICULTY selector, VOLUME slider, SFX switch, BACK | Toggles co-op tank select, picks EASY/NORMAL/HARD (Left/Right or click), and adjusts master volume plus SFX; preferences persist |
| Dawn cutscene | —                                    | Plays when the freshwater goal is met; ENTER returns to the menu |
| Play          | —                                    | HUD visible; Esc opens the pause overlay                              |
| Pause overlay | RESUME, RESTART, QUIT TO MENU        | Gameplay state stays intact; Esc also resumes; RESTART keeps the mode |
| Game over     | PLAY AGAIN, MENU                     | Elastic panel; PLAY AGAIN preserves the previous mode (empty or full) |

## 4. Controls

| Action       | Bindings                                |
| ------------ | --------------------------------------- |
| Move         | `WASD` / arrow keys                     |
| Co-op P1     | `WASD`                                  |
| Co-op P2     | arrow keys                              |
| Steer (drag) | drag anywhere on the tank (touch or mouse) |
| Hide in sand | hold `Down` / `S` (or drag down) over the sand to bury; `Up` (or drag up) to surface (Stingray Tank) |
| Hide in hole | hold `Down` / `S` (or drag down) by a stone-ledge hole to tuck in; release to swim out (Deep Sea Tank) |
| Crawl        | `Left` / `Right` while buried in the sand (Stingray Tank) |
| Break away   | `Up` / `W` (or drag up) to leave a sardine school (Arctic Tank) |
| Pause        | `Escape` / `P`                          |
| Pause button | on-screen button, bottom-left corner    |
| Confirm      | `Enter` / `Space` / mouse / tap         |
| Back         | `Escape` (overlays and menu screens)    |

In **CO-OP DIVE (2P)** the tank holds two of the player creature — two sharks, two
stingrays, or two squids — and each player controls their own: P1 on `WASD`, P2 on the
arrow keys. Score, timer, and tank teleports are shared, and the mode threads through
RESTART and PLAY AGAIN. Pointer drag steers only P1.

In the **Freshwater Tank** chase the river scrolls the ray right automatically, so
strafing is unnecessary: only `Up`/`Down` (arrow keys or `W`/`S`, or drag up/down) steer
the ray, while left/right input is ignored.

## 5. Entities

All entities are procedurally drawn and share the engine `Entity` base: center
position, velocity, collision radius, age, and an `alive` flag. In co-op dives two
player creatures exist (two sharks, stingrays, or squids), one per player; predators
target the nearest visible player.

### 5.1 Shark (player)

- Role: player avatar.
- Look: soft gray-blue body (ellipse), pale belly, two-lobe tail that wiggles faster as
  speed rises, dorsal and pectoral fins, single eye with pupil; blinks translucent
  while invulnerable.
- Movement: exponential steering toward the input direction; max speed 430 px/s,
  response 7/s, turn response 12/s; always confined to the tank.
- Collision radius: 26 px.

### 5.2 Bubble (collectible)

- Role: score and time pickup.
- Look: translucent pale-blue circle with a rim and a highlight dot.
- Behavior: rises 55–95 px/s with a 6–18 px sine wobble; despawns above the tank.
- Collision radius: 9–14 px.
- Spawn: every 0.45–0.95 s, cap 14, at a random x below the tank.
- On collect: +1 score, +1.25 s, foam particle burst, triangle pop blip.

### 5.3 Jellyfish (hazard)

- Role: hazard that punishes greed.
- Look: pulsing pink bell with four waving tentacles and a white highlight.
- Behavior: bobs 40–80 px vertically around its spawn height, drifts horizontally at
  42 px/s, and turns around 70 px from the tank edges.
- Collision radius: 24 px.
- Spawn: every 4.5–7.5 s, cap 3, kept at least 240 px away from the player.
- On contact: −3 s, knockback impulse 520, 1.2 s invulnerability, red flash, screen
  shake, red particle burst, sawtooth hit sound.

### 5.4 Golden Bubble (rare collectible)

- Role: rare time and score boon.
- Look: glowing gold bubble with a slowly rotating sparkle.
- Spawn: 8% chance per bubble spawn, only while no other golden bubble is active.
- Behavior: rises 40–70 px/s (slower than regular bubbles) with the same wobble model.
- Collision radius: 13 px.
- On collect: +5 score, +5 seconds, gold particle burst, two-tone chime.

### 5.5 Angelfish (bonus)

- Role: risky bonus chase target that rewards points, not time.
- Look: tall silver body with two dark stripes, gold fins, gliding with a gentle bob.
- Behavior: enters from either side at 150 px/s, bobs ±11–18 px, despawns after
  crossing the tank.
- Collision radius: 22 px.
- Spawn: reef tank only, every 14–22 s, at most one at a time.
- On contact: +10 score, sparkle burst, ascending chime.

### 5.6 Current and Updraft Zones (environment)

- Role: environment forces that reward route planning.
- Current zone: full-width band 130 px tall that drifts vertically and pushes the shark
  horizontally (320 px/s²) in its flow direction; drawn as faint foam streaks.
- Updraft zone: vertical column 140 px wide that pushes the shark upward (300 px/s²);
  drawn as rising bubble streaks.
- Spawn: every 10–16 s, at most one zone at a time; each lasts 8 s with a 0.7 s
  fade-out.
- Zones affect the shark only.

### 5.7 Stingray (Stingray Tank player)

- Role: the player's avatar after the 60-point teleport.
- Look: flat kite-shaped body with dark spots, whip tail, two top eyes; when hidden,
  only a moving sand mound with peeking eyes shows.
- Movement: exponential steering at 400 px/s, response 5/s, turn response 9/s.
- Burrow: hold `Down`/`S` (or drag down) while over the sand to sink into it. While
  hidden the stingray can only crawl left/right at 130 px/s, dragging its mound along;
  `Up` (or drag up) surfaces. No bubbles can be collected while hidden, so hiding costs
  score and time.
- Surfacing alone does not summon the pack; hunts are gated by how many bubbles the
  stingray collects (§5.8). Surfaced stingrays are still chased more aggressively.
- Collision radius: 24 px.

### 5.8 Eel Pack (Stingray Tank hazard)

- Role: the Stingray Tank's threat: five eels, one in each archway hole.
- Look: long eel bodies — a smooth torso that tapers from the head to a thin tail with a
  lighter dorsal ridge, and a pointed snout whose jaws are lined with small, needle-like
  white teeth. The jaws gape open only when a hunting eel comes within 140 px of a
  surfaced stingray, easing shut otherwise. The body keeps its full length at any
  swimming speed. Inside their holes they are invisible, and peeking shows only the head
  sliding out of the dark hole.
- Cycle: in their holes until the stingray has collected 10 bubbles since the last hunt
  → peek warning (2.2 s, each eel peeks at a random moment) → all five emerge and hunt
  together (6 s) → retreat into their own holes → repeat. The wait is progress-gated,
  not time-gated, so the eels never become a constant threat; leftover bubbles carry
  toward the next hunt.
- Hunting: 240 px/s toward the stingray, ×1.25 while it is surfaced. A hidden stingray
  cannot be tracked: the pack converges on the last place the stingray was seen and
  slowly circles it, so it loses a mound that crawls away; a hidden stingray can never
  be bitten.
- Bite (surfaced contact): −15 points (floor 0, a severe deduction), knockback 500,
  1.5 s invulnerability, red flash, screen shake, green particle burst.
- Collision radius: 16 px.

### 5.9 Rock Archway (Stingray Tank scenery)

- A rock archway spanning the tank: two legs rising from the sand and a curved beam
  across the top with five evenly spaced arch holes.
- Hole centers sit at x = width × (i+1)/6 along the beam; the eel pack lives in them.
- Purely decorative: it does not block movement; only the eels use it.
- Colors: `rock` and `rockDark` with near-black holes.

### 5.10 Red Shrimp (Stingray Tank bonus)

- Role: the bonus chase target inside the Stingray Tank, replacing the angelfish.
- Look: small red shrimp with a curved segmented body, a tail fan that flicks as it
  falls, thin antennae, and a single dark eye.
- Behavior: spawns at the top of the tank and sinks 55–90 px/s with a gentle horizontal
  wiggle; despawns when it reaches the sand.
- Collision radius: 14 px.
- Spawn: stingray tank only, every 7–12 s, at most one at a time.
- On contact: +10 score, red sparkle burst, bonus chime (same as the angelfish).

### 5.11 Squid (Deep Sea Tank player)

- Role: the player's avatar in the Deep Sea Tank.
- Look: pale rose torpedo mantle with fin markings, two large eyes, and four wavy arms
  trailing from the front; fades and shrinks while tucked into a hole.
- Movement: exponential steering at 420 px/s, response 6/s, turn response 10/s.
- Hiding: hold `Down`/`S` (or drag down) near a stone-ledge hole to tuck inside. A
  hidden squid is anchored in the hole and cannot be bitten or tracked by anglerfish;
  releasing `Down` swims back out.
- Collision radius: 22 px.

### 5.12 Anglerfish (Deep Sea Tank hazard)

- Role: the Deep Sea Tank's roamers.
- Look: dark round body with a huge gaping jaw full of long needle teeth, a small eye,
  a tail fin, and a pale glowing lure swinging above the head (brighter while hunting).
- Behavior: three of them actively roam waypoints at 55 px/s. A surfaced squid within
  320 px is chased at 115 px/s; when the squid hides, they lose track, search the last
  seen spot for up to 4 s, then resume roaming.
- On contact with a surfaced squid: −20 points (floor 0), knockback 520, 1.5 s
  invulnerability, red flash, screen shake, lure-green burst.
- Collision radius: 22 px.

### 5.13 Crab (Deep Sea Tank bonus)

- Role: the deep-sea bonus bounty.
- Look: small crab with a round shell, two snapping claws, six legs, and eyes on stalks.
- Behavior: spawns at the top of the tank and sinks 50–80 px/s with a gentle horizontal
  wiggle; despawns at the sea floor.
- Collision radius: 16 px.
- Spawn: deep sea only, every 9–14 s, at most one at a time.
- On contact: +15 score, orange sparkle burst, bonus chime.

### 5.14 Stone Ledges (Deep Sea Tank hiding spots)

- Role: the deep sea's hiding places.
- Layout: two rounded stone slabs (220×56 px) at different depths, each pierced by two
  dark oval holes (52×46 px).
- Behavior: purely decorative except for hiding — holding `Down` within 52 px of a hole
  tucks the squid inside; anglerfish cannot track a squid in a hole.
- Colors: `rock` and `rockDark`.

### 5.15 Arctic Shrimp (Arctic Tank player)

- Role: the player's avatar in the Arctic Tank.
- Look: small grey shrimp with a segmented body, a flicking tail fan, antennae, and a
  dark eye.
- Movement: exponential steering at 430 px/s, response 6/s, turn response 10/s.
- Schools: swimming into a sardine school automatically attaches the shrimp to it — it
  rides along with the school and becomes concealed (seals cannot track or bite it, and
  it cannot collect). `Up` (or drag up) breaks away, with a short re-entry cooldown.
- Collision radius: 20 px.

### 5.16 Seals (Arctic Tank hazard)

- Role: two seals perched on the ice chunk.
- Look: grey seals with round heads, whiskers, and flippers — perched upright on the
  ice, sleek trail-bodied swimmers when hunting.
- Cycle: perched → **every 15 plankton collected** sends both diving off the ice (0.8 s)
  → chase for 7 s at 130 px/s → climb back to their perch → repeat. Leftover plankton
  carry toward the next dive.
- Tracking: they chase the nearest surfaced shrimp; a shrimp sheltered in a sardine
  school is untrackable, so they circle the last-seen spot (90 px/s search) until the
  chase ends.
- Bite (unsheltered contact): −25 points (floor 0), knockback 540, 1.5 s invulnerability,
  red flash, screen shake, icy particle burst.
- Collision radius: 22 px.

### 5.17 Plankton (Arctic Tank bonus)

- Role: the arctic collectible, replacing crabs.
- Look: small glowing green specks with antennae and a soft halo.
- Behavior: drift from the right edge to the left at 60–100 px/s with a gentle bob;
  despawn off the left edge. Several can drift at once (cap 8).
- Collision radius: 8 px.
- Spawn: every 1.2–2.4 s.
- On contact: +5 score, green sparkle burst, bonus chime; each plankton adds one to the
  seals' charge toward their next dive.

### 5.18 Sardine Schools (Arctic Tank hiding spots)

- Role: the arctic hiding places.
- Look: two wandering shoals of 12 tiny silver sardines fluttering around a drifting
  center.
- Behavior: each school drifts on a slow lissajous wander; swimming into one attaches
  the shrimp to it automatically (§5.15). Seals cannot track a shrimp inside a school.

### 5.19 Ice Chunk (Arctic Tank scenery)

- Role: the floating ice floe the seals perch on.
- Look: a 250×52 px slab of pale ice with darker cracks and an underwater underside.
- Perches: two spots on its top edge where the seals sit; purely decorative otherwise.

### 5.20 Moon Jelly (Jelly Tank player)

- Role: the player's avatar in the Jelly Tank.
- Look: pulsing pink bell with a scalloped rim, five wavy stinging tentacles, and a soft
  highlight; tilts slightly with its drift.
- Movement: exponential steering at 350 px/s, response 5/s, turn response 8/s; the bell
  pulses continuously.
- Tangling: simply swimming into a minnow tangles it in the tentacles — it wriggles
  attached below the bell for 0.7 s, then yields +1 miniboss point and +5 score.
- Collision radius: 22 px.

### 5.21 Turtle (Jelly Tank miniboss)

- Role: the tank's miniboss; it patrols and periodically charges the player.
- Look: green plated shell with flippers and a tail, and a distinct lighter head with
  two eyes; circling gold stars when stunned.
- Behavior: patrols slowly (60 px/s) between waypoints, charges the nearest player every
  4–6.5 s for 1.6 s at 170 px/s, then recovers briefly before patrolling again.
- Head stun: ramming the **head** (the front hitbox) stuns the turtle for 4 s, during
  which it drifts harmlessly and cannot attack; the head is the only way to stun it.
- Body contact while not stunned: −10 points, knockback 480, 1.2 s invulnerability, red
  flash, screen shake.
- Collision radius: 30 px body, 18 px head at a 40 px forward offset.

### 5.22 Minnow (Jelly Tank collectible)

- Role: the rare swimming target that supplies miniboss points.
- Look: small tan fish that darts around and wriggles hard while tangled.
- Behavior: wanders in short random darts at 60–110 px/s; spawns rarely (every 4–7 s,
  at most 2 at a time).
- On tangle: +1 miniboss point, +5 score, tan sparkle burst, soft chime.
- Collision radius: 12 px.

### 5.23 Freshwater Stingray (Freshwater Tank player)

- Role: the player's avatar in the auto-scrolling chase.
- Look: freshwater stingray — darker brown body with yellow spots and black dot eyes.
- Movement: the river pins the ray to a screen lane (x ≈ 280) and scrolls the world
  right-to-left at 150 px/s; only vertical steering applies (`Up`/`Down`, `W`/`S`, or
  drag), and horizontal input is ignored.
- Burrow: unchanged — hold `Down` over the sand to hide and let large rocks roll over.
- Tangling: freshwater plants briefly tangle the ray (inputs dampened, and the lane
  drags 70 px back toward the catfish) and cost 5 score.
- Collision radius: 24 px.

### 5.24 Catfish (Freshwater Tank chaser)

- Role: the giant catfish chasing from behind.
- Look: massive mottled brown catfish with a broad head, three barbels, fins, and a
  single dark eye; circling gold stars when stunned.
- Behavior: creeps toward the nearest player at 45 px/s, tracking vertically slowly. It
  starts off-screen behind at x = −160 and only overtakes if the player is slowed.
- Stun: a piranha school reaching the catfish stuns it for 4.5 s, during which it falls
  back at 90 px/s — the only way to buy distance.
- Bite: −15 points, knockback 300, 1.5 s invulnerability, red flash, screen shake, and
  the catfish is shoved back 320 px.
- Collision radius: 34 px.

### 5.25 Freshwater Obstacles

- Logs: bob in the lower water; hitting one costs 5 points.
- Large rocks: roll along the riverbed; hitting one costs 10 points — burrow under the
  sand to let them pass.
- Freshwater plants: sway up from the riverbed; brushing one tangles the ray (−5).
- Piranha schools: dark fish with red bellies swimming leftward; hitting one costs 10
  points and scatters it, but letting one past the player stuns the catfish.
- Difficulty ramp: as sunrise progress grows, spawn intervals shrink toward ×0.55, the
  river scrolls up to ×1.35, and the catfish chases up to ×1.6 faster.
- All of them scroll with the current and despawn off-screen; contact requires a
  surfaced ray.

### 5.26 Bubble Lines (Freshwater Tank goal)

- Freshwater bubbles spawn in horizontal rows of 4–7, spaced 64 px apart, at a random
  height, and scroll left with the current.
- They do not rise or wobble; collect them by lining up as the row passes through the
  ray's lane. Each bubble gives +1 score and +1.25 seconds and counts toward the goal.
- Goal: the tank's objective is **150 bubbles** — the `sunrise` meter. The HUD shows
  `SUNRISE n%`, and reaching 100% ends the chase in the dawn cutscene, which announces
  `YOU SURFACED 150 BUBBLES`.

### 5.27 Electric Eels (Freshwater Tank late hazard)

- Role: the late-chase threat that forces burrowing; they only appear once sunrise
  progress passes 20%.
- Look: long olive eel with an elongated tapering fish body, a wavy dorsal fin and anal
  fin running the length of the body, small pectoral fins behind the head, and glowing
  spark arcs around a faint electric field ring.
- Behavior: swims in from the right slightly faster than the current, seeking the depth
  of the nearest surfaced ray; spawns every 6.5–9.5 s (scaled by the ramp).
- Shock: touching the 44 px field costs 15 points, knocks the ray back, and paralyzes
  it for 0.8 s (dampened controls, lane dragged toward the catfish).
- Burrowing under the sand is the counter — a concealed ray is immune and untracked.
- Collision radius: 20 px body, 44 px field.

## 6. Scoring, Progression, and Persistence

- Score = bubbles collected, +5 for golden bubbles, +10 for angelfish and shrimps, +15
  for crabs, +5 for plankton, +5 per tangled minnow. Penalties: −5 for logs and plant
  tangles, −10 for rocks and piranhas, −15 for catfish bites. The timer is the only
  resource; there are no lives.
- Difficulty ramps over the first 60 seconds of a dive:

  | Effect                   | Base        | Ramp                                  |
  | ------------------------ | ----------- | ------------------------------------- |
  | Bubble spawn interval    | 0.45–0.95 s | ×0.55 by 60 s                         |
  | Jellyfish spawn interval | 4.5–7.5 s   | ×0.5 by 60 s                          |
  | Jellyfish cap            | 3           | +1 every 30 s, up to 5                |

- Difficulty (SETTINGS): EASY / NORMAL / HARD are a dramatic spread over enemy speeds
  (×0.5 / ×1 / ×1.6), spawn intervals (×2 / ×1 / ×0.5), score penalties (×0.4 / ×1 / ×2,
  rounded), invulnerability grace (×1.5 / ×1 / ×0.6), tank clocks (×1.5 / ×1 / ×0.75),
  and pack charge thresholds (×1.5 / ×1 / ×0.6 — eels wake after 15 / 10 / 6 bubbles and
  seals dive after 23 / 15 / 9 plankton). NORMAL is the default and matches the tuning
  tables above.
- Best score persists under `sharkquarium.best-score` and is shown on the menu, the
  HUD, and the game over panel (`NEW BEST!` when beaten).
- Settings persist under `sharkquarium.settings` as
  `{ coopTankSelect, difficulty, volume, sfx }`.
- Lifetime stats persist under `sharkquarium.stats` as `{ games, bubbles, longestRun }`,
  recorded only when a non-empty dive completes:
  - games: completed dives; bubbles: total bubbles collected (golden included);
    longestRun: longest dive in seconds.
  - Shown on the menu; the game over panel adds a `LONGEST RUN` line and highlights
    `NEW LONGEST RUN` records.
  - The EMPTY TANK test mode never writes score or stats.
- Tank teleports: at 60 points the reef dive becomes the Stingray Tank; at 250 points
  that becomes the Deep Sea Tank; after 40 bubbles collected there it becomes the Arctic
  Tank; after 30 plankton collected there it becomes the Jelly Tank miniboss; clearing
  that opens the Freshwater Tank chase. Score, timer, bubbles collected, and elapsed
  time carry over so the whole run stays one continuous score.
- Miniboss clear: tangling 10 minnows opens the Freshwater Tank chase with a fanfare.
- Freshwater goal: collecting 150 bubbles in the tank completes the run — best score
  and stats are saved and the dawn cutscene plays before returning to the menu.

## 7. HUD and Player Feedback

- Top-left: bubble icon and score; the icon and number pulse gold when the score rises.
- Top-right: best score.
- Top-center: time bar smoothed toward `timeLeft / timeLimit` plus a numeric countdown;
  both turn red and pulse during the final 5 seconds, with a tick sound each second.
- Bottom-left: on-screen pause button (mouse and touch).
- Bottom-right: `ESC — PAUSE` hint.
- Bottom-center: `EMPTY TANK — UI TEST` badge in the test mode, a burrow hint in the
  Stingray Tank (`HOLD DOWN ON THE SAND TO HIDE FROM THE EELS`, switching to
  `LEFT / RIGHT TO CRAWL — UP TO SURFACE` while hidden), or a ledge hint in the Deep Sea
  Tank (`HOLD DOWN NEAR A LEDGE HOLE TO HIDE FROM THE ANGLERFISH`, switching to
  `HIDDEN IN THE LEDGE — RELEASE DOWN TO SWIM OUT`).
- Stingray Tank: an eel status line under the timer (`EELS — IN THEIR HOLES n/need`,
  10 on NORMAL, counting down to the next hunt, then `PEEKING OUT / HUNTING /
  RETREATING`), pulsing red while hunting.
- Deep Sea Tank: an anglerfish status line (`ANGLERFISH — ROAMING / SEARCHING /
  HUNTING`), pulsing red while hunting.
- Arctic Tank: a seal status line (`SEALS — ON THE ICE n/need`, 15 on NORMAL, then
  `DIVING / HUNTING / CLIMBING BACK`), pulsing red while hunting, plus a school hint
  (`SWIM INTO A SARDINE SCHOOL TO HIDE FROM THE SEALS`, switching to
  `IN THE SARDINE SCHOOL — PRESS UP TO BREAK AWAY`).
- Jelly Tank: a miniboss status line (`MINIBOSS n/10 — TURTLE PATROLLING / CHARGING /
  RECOVERING / STUNNED`), pulsing red while charging, plus a hint
  (`SWIM INTO MINNOWS TO TANGLE THEM — RAM THE TURTLE'S HEAD TO STUN IT`).
- Freshwater Tank: a catfish status line (`CATFISH — LURKING BEHIND / CHASING /
  STUNNED — SUNRISE n%`), pulsing red while chasing, plus a hint
  (`DOWN OVER THE SAND DODGES ROCKS — LET PIRANHAS PAST TO STUN THE CATFISH`).
- Dawn cutscene: the window fills the screen as the sun rises — night fading, stars,
  glitter on the water, glass reflections, and light entering the tank — with the score
  and 150-bubble goal shown; ENTER returns to the menu.
- Teleport arrival: a banner fades out and a particle swirl marks the arrival
  (`STINGRAY TANK — THE EELS ARE WATCHING`, `DEEP SEA TANK — THE LURES ARE LIGHTS`,
  `ARCTIC TANK — THE SEALS ARE WATCHING`, `JELLY TANK — TANGLE THE MINNOWS — STUN THE
  TURTLE`, or `FRESHWATER TANK — OUTRUN THE CATFISH`).
- Co-op dives show a two-color control legend under the score (`P1 — WASD` in bubble
  blue, `P2 — ARROWS` in gold).
- Game over panel: score, best, and a `LONGEST RUN` line.
- Feedback: particle bursts, red hit flash, screen shake, invulnerable blinking, and the
  elastic scale-in on the game over panel.

## 8. Art and Audio Direction

Palette:

| Token      | Value                     | Use                              |
| ---------- | ------------------------- | -------------------------------- |
| abyss      | `#04101d`                 | deep water, page background      |
| deep       | `#0a2740`                 | upper water gradient             |
| mid        | `#10456b`                 | water accent                     |
| ray        | `rgba(191, 233, 255, .06)`| light shafts                     |
| bubble     | `#cfefff`                 | bubbles, UI glow                 |
| foam       | `#8fd0ef`                 | secondary text                   |
| text       | `#eaf6ff`                 | primary text                     |
| textDim    | `rgba(234, 246, 255, .65)`| muted text                       |
| accent     | `#ffd166`                 | time bar, selections, highlights |
| danger     | `#ff6b81`                 | jellyfish hits, low time         |
| shark      | `#6f8fa6`                 | shark body                       |
| sharkFin   | `#54748b`                 | fins and tail                    |
| sharkBelly | `#d9e8f0`                 | shark belly                      |
| jelly      | `#ff8fa3`                 | jellyfish                        |
| sand       | `#c4af87`                 | Stingray Tank floor              |
| sandDark   | `#b09a72`                 | sand shading and burrow mounds   |
| rock       | `#6d7178`                 | archway rock                     |
| rockDark   | `#565a61`                 | rock texture and shading         |
| stingray   | `#8b8272`                 | stingray body                    |
| eel        | `#5d7a52`                 | eel body                         |
| shrimp     | `#e26052`                 | red shrimp                       |
| squid      | `#d29aa6`                 | squid body                       |
| angler     | `#454e5b`                 | anglerfish body                  |
| lure       | `#baf7d8`                 | anglerfish glowing lure          |
| crab       | `#d96448`                 | crab shell and claws             |
| arcticshrimp | `#9aa0a6`               | grey arctic shrimp               |
| seal       | `#93a3b1`                 | seal body                        |
| sardine    | `#c9d8e2`                 | sardine bodies                   |
| ice        | `#dcecf5`                 | ice chunk                        |
| iceDark    | `#b3d0e0`                 | ice shading and cracks           |
| plankton   | `#cdeec2`                 | glowing plankton                 |
| turtle     | `#5d8f6a`                 | turtle shell                     |
| turtleDark | `#3f6b4d`                 | shell plates, flippers, head     |
| minnow     | `#d6bd8a`                 | minnow bodies                    |
| rayFresh   | `#6b4a34`                 | freshwater stingray body         |
| raySpot    | `#e8c95a`                 | freshwater ray spots             |
| catfish    | `#7a6a58`                 | catfish body                     |
| catfishDark| `#5f5244`                 | catfish fins, mottling, barbels  |
| log        | `#7d5c3f`                 | drifting logs                    |
| weed       | `#4f7a3a`                 | freshwater plants                |
| weedDark   | `#3a5c2a`                 | plant roots and shadows          |
| electric   | `#8a9a4f`                 | electric eel bodies              |

- All art is procedural canvas drawing; no image files ship in the artifact.
- Backdrop: vertical gradient, three swaying light shafts, vignette. The menu adds
  ambient rising bubbles and a shark gliding across the tank. The Deep Sea Tank uses a
  darker water palette (`DEEPSEA_PALETTE`: `#07202f` → `#010406`); the Arctic Tank uses
  a pale icy palette (`ARCTIC_PALETTE`: `#10394f` → `#061a26`); the Jelly Tank uses an
  indigo palette (`JELLY_PALETTE`: `#1b2447` → `#0a0d1f`); the Freshwater Tank uses a
  murky green palette (`FRESHWATER_PALETTE`: `#33513a` → `#16251c`).
- Audio is synthesized WebAudio only. Master volume (default 70%) and the SFX switch
  live in SETTINGS: SFX off mutes every cue, and the volume slider scales the whole
  bus; both are re-applied on startup from the saved settings.
- Miniboss music: the Jelly Tank and Freshwater Tank play looping synthesized themes —
  turtle: an A-minor pulse at 140 BPM; catfish: a D-minor drive at 150 BPM — sequenced
  in eighth notes through the same bus. They pause with gameplay, stop on scene
  changes, and follow the volume and SFX settings.

| Cue        | Shape                                                              |
| ---------- | ------------------------------------------------------------------ |
| UI confirm | Sine 300 → 620 Hz, 0.14–0.16 s (menu choices, pause actions, game over) |
| UI back    | Sine 520 → 320 Hz, 0.1 s (closing HOW TO PLAY)                     |
| UI navigate| Sine 640 Hz, 0.05 s (selection changes)                            |
| Pause      | Sine 300 Hz pause / 560 Hz resume, 0.08 s                          |
| Bubble pop | Triangle 480 → 900 Hz, 0.11 s                                      |
| Golden pop | Triangle 620 → 980 Hz + 980 → 1240 Hz, 0.12 / 0.14 s               |
| Angelfish  | Triangle 740 → 1180 Hz, 0.18 s                                     |
| Jelly hit  | Sawtooth 160 → 70 Hz, 0.3 s                                        |
| Low time   | Square 720 Hz tick, 0.06 s, at ≤ 5 s remaining                     |
| Burrow     | Sine 220 → 90 Hz, 0.25 s                                           |
| Surface    | Sine 120 → 380 Hz, 0.2 s                                           |
| Squid hide | Sine 320 → 140 Hz, 0.22 s                                          |
| Squid exit | Sine 140 → 420 Hz, 0.18 s                                          |
| Eel hit    | Sawtooth 120 → 60 Hz, 0.4 s                                        |
| Angler hit | Sawtooth 100 → 50 Hz, 0.45 s                                       |
| Seal hit   | Sawtooth 140 → 60 Hz, 0.4 s                                        |
| Turtle hit | Sawtooth 90 → 50 Hz, 0.35 s                                        |
| Tangle     | Triangle 520 → 880 Hz, 0.12 s                                      |
| Stun       | Triangle 880 → 1320 Hz + 1320 → 1760 Hz, 0.15 / 0.2 s              |
| Log thud   | Sine 120 → 60 Hz, 0.2 s                                            |
| Rock crash | Sawtooth 80 → 40 Hz, 0.4 s                                         |
| Plant tangle | Triangle 200 → 120 Hz, 0.25 s                                    |
| Piranha bite | Sawtooth 200 → 90 Hz, 0.25 s                                     |
| Catfish stun | Triangle 660 → 990 Hz + 990 → 1320 Hz, 0.15 / 0.2 s              |
| Catfish bite | Sawtooth 70 → 35 Hz, 0.5 s                                       |
| Electric shock | Sawtooth 300 → 80 Hz, 0.3 s                                    |
| Dawn       | Triangle arpeggio 392 / 523 / 659 / 784 Hz                         |
| Miniboss music | Looping triangle bass + square lead + hats, 140–150 BPM        |
| Miniboss   | Triangle arpeggio 523 / 659 / 784 / 1047 Hz                        |
| Teleport   | Triangle 200 → 1200 Hz, 0.5 s                                      |
| Game over  | Triangle arpeggio 392 / 523 / 659 Hz                               |

## 9. Test Modes

`EMPTY TANK` (tank select) starts a dive with spawning disabled and a 10 second clock. It
exists so the full navigation shell — HUD, pause menu, game over — can be exercised
while the game itself is a stub; the HUD shows an `EMPTY TANK — UI TEST` badge. It still
ends in game over, PLAY AGAIN keeps the mode, and it never writes score or stats.

## 10. Backlog

- [ ] Replace the starter concept and lore with the real design.
- [x] Difficulty ramp: spawn-rate and jellyfish-cap curves over elapsed time.
- [x] New entities: golden bubble, angelfish bonus, current/updraft zones.
- [x] Touch controls: drag-to-swim, on-screen pause.
- [x] Persistent stats: games played, total bubbles, longest run.
