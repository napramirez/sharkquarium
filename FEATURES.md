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
- When the clock hits zero the lights go out and the lap ends.

Tone: calm, cozy, friendly. No gore; the clock is the only pressure.

## 2. Core Loop and Session

1. A dive starts with 30 seconds on the clock.
2. Collect a bubble: +1 score and +1.25 seconds.
3. Bump a jellyfish: −3 seconds, knockback, and 1.2 seconds of blinking invulnerability.
4. At zero: show the score, persist a new best, and offer another dive.

Chaining bubbles extends the run, so difficulty is player-driven rather than scripted.
Session length is about one minute.

## 3. Navigation and Screens

Flow: `boot → menu → play ⇄ pause → game over → play or menu`

Requirements:

- Every screen is fully operable with the keyboard alone; mouse hover and click are
  convenience layers, never required.
- Selection lists wrap around, play a blip when the selection moves, and confirm with
  Enter, Space, or a click.
- `Esc` resumes from pause and closes overlays; `Esc` on game over returns to the menu.

| Screen        | Options                              | Behavior                                                              |
| ------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Boot          | —                                    | Loads the asset manifest, then hands off to the menu                  |
| Main menu     | START DIVE, HOW TO PLAY, EMPTY TANK  | Ambient tank scene; HOW TO PLAY opens an overlay closed with Enter or Esc |
| Play          | —                                    | HUD visible; Esc opens the pause overlay                              |
| Pause overlay | RESUME, RESTART, QUIT TO MENU        | Gameplay state stays intact; Esc also resumes; RESTART keeps the mode |
| Game over     | PLAY AGAIN, MENU                     | Elastic panel; PLAY AGAIN preserves the previous mode (empty or full) |

## 4. Controls

| Action  | Bindings                                |
| ------- | --------------------------------------- |
| Move    | `WASD` / arrow keys                     |
| Pause   | `Escape` / `P`                          |
| Confirm | `Enter` / `Space` / mouse / tap         |
| Back    | `Escape` (overlays and menu screens)    |

## 5. Entities

All entities are procedurally drawn and share the engine `Entity` base: center
position, velocity, collision radius, age, and an `alive` flag.

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

## 6. Scoring, Progression, and Persistence

- Score = bubbles collected. The timer is the only resource; there are no lives.
- The best score persists under `sharkquarium.best-score` and is shown on the menu, the
  HUD, and the game over panel (`NEW BEST!` when beaten).
- Current build uses constant spawn rates. Planned progression: ramp the spawn rate with
  elapsed time and raise the jellyfish cap after 30 seconds.

## 7. HUD and Player Feedback

- Top-left: bubble icon and score; the icon and number pulse gold when the score rises.
- Top-right: best score.
- Top-center: time bar smoothed toward `timeLeft / timeLimit` plus a numeric countdown;
  both turn red and pulse during the final 5 seconds, with a tick sound each second.
- Bottom-right: `ESC — PAUSE` hint.
- Bottom-center: `EMPTY TANK — UI TEST` badge while in the test mode.
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

- All art is procedural canvas drawing; no image files ship in the artifact.
- Backdrop: vertical gradient, three swaying light shafts, vignette. The menu adds
  ambient rising bubbles and a shark gliding across the tank.
- Audio is synthesized WebAudio only:

| Cue        | Shape                                                              |
| ---------- | ------------------------------------------------------------------ |
| UI confirm | Sine 300 → 620 Hz, 0.14–0.16 s (menu choices, pause actions, game over) |
| UI back    | Sine 520 → 320 Hz, 0.1 s (closing HOW TO PLAY)                     |
| UI navigate| Sine 640 Hz, 0.05 s (selection changes)                            |
| Pause      | Sine 300 Hz pause / 560 Hz resume, 0.08 s                          |
| Bubble pop | Triangle 480 → 900 Hz, 0.11 s                                      |
| Jelly hit  | Sawtooth 160 → 70 Hz, 0.3 s                                        |
| Low time   | Square 720 Hz tick, 0.06 s, at ≤ 5 s remaining                     |
| Game over  | Triangle arpeggio 392 / 523 / 659 Hz                               |

## 9. Test Modes

`EMPTY TANK` (main menu) starts a dive with spawning disabled and a 10 second clock. It
exists so the full navigation shell — HUD, pause menu, game over — can be exercised
while the game itself is a stub; the HUD shows an `EMPTY TANK — UI TEST` badge. It still
ends in game over, and PLAY AGAIN keeps the mode.

## 10. Backlog

- [ ] Replace the starter concept and lore with the real design.
- [ ] Difficulty ramp: spawn-rate and jellyfish-cap curves over elapsed time.
- [ ] New entities: golden bubble, angelfish bonus, current/updraft zones.
- [ ] Touch controls: drag-to-swim, on-screen pause.
- [ ] Persistent stats: games played, total bubbles, longest run.
