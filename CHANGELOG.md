# Changelog

Notable changes to Sharkquarium, grouped into the contiguous days the work landed and
split into **game features** (player-facing content like tanks, creatures, modes,
screens, cosmetics, and progression) and **game systems** (the engine, rendering,
persistence, tuning frameworks, tooling, tests, and docs that support them). Each section
names the commits that carry the work.

## November 23, 2026 (latest)

The **ANIMATION CENTER** screen, a **TRANSFER CODE** account option with **instant account delete**, two new deep-sea creatures (**GIANT ISOPOD** and **BLACK SWALLOWER**), a round of shark artwork (a rebuilt **sawfish**, a restyled **thresher** with a whiplike lash, new **sixgill** fins, and a loosejaw whose jaws swing wider with a folded elastic ligament), **crisp native-resolution rendering**, and music upgrades (a real **SNARE**, more **SYNTH** notes, audible level **hi-hats**, and dozens more FINN answers).

- **TRANSFER CODE** — a new ACCOUNT menu row named **TRANSFER CODE** that shows your transfer code on the spot (no password prompt) and copies it to the clipboard: a short, memorable **six-digit number ending in a check letter (A–D)**, generated per account. To move the account to another device, open **ENTER TRANSFER CODE**, key in that short code and your **password** (the **account name** is optional — leave it blank and the code alone signs you in), and you are signed in there. Accounts live in this device's local storage, so the short code carries your **identity**, not your whole save — each device keeps its own local progress. (`currentTransferCode()` / `claimTransferCode()` in `src/engine/accounts.js`, `src/scenes/account.js`.)
- **Crisp, native-resolution rendering** — the canvas backing store now matches the display's true `devicePixelRatio` (up to 3) instead of being capped at 1.5 / 1920×1080, so the browser no longer rescales the image and everything renders **razor-sharp with no softening**; image smoothing is also disabled on the main context. Per-frame input-binding allocation is avoided too (`src/engine/game.js`, `src/engine/input.js`).
- **Instant account delete** — **DELETE ACCOUNT** now always opens the account list, and clicking an account deletes it immediately with no password step (deleting the signed-in one also signs you out).
- **ANIMATION CENTER** — a new main-menu screen that lists every **sea creature with its own animation** (the cuttlefish's feeding strike, the frogfish's lure wave, the stoplight loosejaw's jaw snap, the goblin shark's jaw lunge, the black swallower's gulp, the anglerfish's lure glow, the hatchetfish's glow flash, the oarfish's ripple and the sacabambaspis's swim wiggle) and plays that animation **live** in a preview panel **at each creature's real in-game size** (the config radii — cuttlefish 24, frogfish 28, loosejaw 30, goblin shark 50, black swallower 18, anglerfish 22, hatchetfish 20, oarfish 66, sacabambaspis 16; the long oarfish is the only one shown zoomed to fit). The previews run the **real in-game animation logic at the same speeds** — the cuttlefish and black swallower drive their actual entities (their own strike timer and gulp decay), and the goblin shark, stoplight loosejaw, frogfish, hatchetfish and oarfish reuse their tanks' state machines and `GOBLIN`/`TWILIGHT`/`OARFISH` constants — not hand-rolled approximations. Creatures whose only animation is an **emote** are deliberately left out. The catalog lives in `src/engine/animations.js`; the screen is `src/scenes/animations.js`.
- **GIANT ISOPOD & BLACK SWALLOWER** — two new original deep-sea creatures that roam the **DEEP SEA TANK** as hazards (`src/entities/isopod.js`, `src/entities/blackswallower.js`). The **giant isopod** is a plated sea-woodlouse that scuttles along the sea floor (contact −10, knockback 360); the **black swallower** is a small jet-black fish with an inflating stomach that drifts until you come close, then darts in with a **lower jaw that swings open every time it eats** (the mouth gapes forward, driven by the swallow, then snaps shut — now with teeth on **both** the upper and lower jaw) while its stomach visibly swells (contact −14, knockback 420). Both join the codex with LORE entries, SEA FACTS, codex portraits and FINN answers.
- **Sawfish rebuilt** — the **smalltooth sawfish** now rides the **stingray body** (smaller wingspan) with a straight, connected toothed **saw**, a long **shark trapezoid tail**, **black dot eyes**, and two large **flat symmetrical triangular fins attached to the back of the fish** (one either side, single points aimed outward) — `drawSawfish` reuses `drawStingrayBody` and the new shared `drawSharkTail` (`src/entities/realfish.js`, `shark.js`, `stingray.js`).
- **More spines and a bigger eye** — the DEEP SEA **anglerfish** grew extra glowing fin spines on its back, belly and tail, and the stoplight loosejaw's solid-red eye is slightly larger.
- **Flatter sacabambaspis** — the sacabambaspis is now a **flatter oval** (squashed to ~66% height), so the goofy Ordovician fish reads wider and rounder in the REEF RUSH skin, the codex and the ANIMATION CENTER (`drawSacabambaspis` in `src/entities/sacabambaspis.js`).
- **Loosejaw's jaws swing wider** — the stoplight loosejaw's **upper jaw now thrusts further forward** on a strike (a forward lunge plus a bigger tilt), and its **lower jaw hangs open wider**, now with a visible black **V-shaped elastic ligament** folded to a **90° angle** whose point sits **between the lower jaw and the neck just behind the head-body junction** (one arm on the middle of the lower jaw, one on the neck; thinner the wider the jaw opens, and drawn beneath the head so it does not flash over it as the jaw snaps) to explain how it snaps so fast (`drawLoosejawHead` in `src/entities/deepfish.js`). The change shows in the GOBLIN DEEP, the TWILIGHT hunter, and the ANIMATION CENTER preview (they share the same draw).
- **More FINN answers** — dozens more greetings, free answers, jokes, riddles, sign-offs, asides, tips, recommendations and small talk in the AI CHAT (`src/scenes/chat.js`).
- **Real snare drum + drum playback hardening** — the TRACK BUILDER's DRUMS **SNARE** line is now a proper two-layer snare (**band-passed noise crack plus a short low body tone**, `DRUM_SOUNDS` supports a `layers` set and `drumVoices()`), instead of the old hat-like high-pass blip, so it sounds in every mode. Drum playback is also hardened so an out-of-range drum line can no longer throw — the track builder's preview/step playback falls back to the first drum sound (`DRUM_SOUNDS[line] ?? DRUM_SOUNDS[0]`) and `loadComposer()` clamps saved line indices.
- **More SYNTH notes** — the TRACK BUILDER's **SYNTH** track grew from seven notes to **twenty-eight**, adding two-and-a-bit octaves below C4 (B3 down to C1) so there is a lot more melodic range to sequence; existing saved notes keep their pitches because the new notes are appended below. Blocks now scale their height to the row spacing so a long instrument still reads cleanly (`src/engine/composer.js`, `src/scenes/trackbuilder.js`).
- **Thresher shark restyled** — the **thresher shark** is now a **gray** shark that borrows the **sixgill's** body, cream belly, six gill slits, dark eye, toothy mouth and full fin set, and its tail is the **sixgill's tail** (trapezoid peduncle with the shark's fins and a triangle caudal) wreathed in a **gray gradient**. Extending from the **top tip of the tail** is a long **whiplike lash** built as a fixed-length **follow-the-leader chain** (12 segments of 20 px, the same trail-follow physics as the stingray tank's moray tails) — so it keeps its full length even when the shark stops, **stiffens straight during the wind-up** and then lags and lashes through the whip, and **deals damage** on contact (`drawThresher` in `src/entities/realfish.js`; the whip chain and its hit test live in `src/scenes/thresher.js`).
- **Hi-hats no longer go mute in level music** — the sequenced level tracks' percussion was a 0.02 s **6.2 kHz square at `volume: 0.012`** (effectively silent, and the old 8-bit path used only 0.026), so the "drums" of every tank and minigame sounded mute. The hat is now an audible **high-passed noise** tick in both modes (0.08 normal / 0.09 in 8-bit), matching the composer's fixed hat (`src/engine/music.js`).
- **THE BLACK SWALLOWER tank** — a new tank (`src/scenes/swallower.js`, listed in CHOOSE TANK) where you play a **sardine** baiting a giant **black swallower**: it patrols, **winds up**, then fires a **straight lunge** along a telegraphed line. Dodge the lunge and steer so it passes through **schools of fish and squid** — every school the swallower gulps swells its belly, and eating enough (six) **defeats it**; get hit and you lose one of three lives. Config `SWALLOWER_TANK`, record mode `swallower`.
- **Moon jelly restyle** — the moon jelly now has a **flatter, thicker, more rectangular bell** (still pulsing and swaying) coloured **bright blue** and **super translucent**, with blue tentacles and ribs (`drawMoonJellyBody` in `src/entities/moonjelly.js`).
- **Dragonfish restyle** — the EVOLUTION TANK's **DRAGONFISH** stage is now a real black dragonfish: a **long, thin, perfectly straight** moray-style body (about twice as slim as the moray eels) in **super-dark-brown** with translucent brown **dorsal and ventral fins**. Its head reuses the **stoplight loosejaw's head model** (`drawLoosejawHead` gained `headColor`/`outlineColor`/`tilt` + `noPhotophores`/`noJaw`/`noLigament` options) with the **eyes kept** but the **red/green stoplight photophores**, the **unhinging jaw** (closed mouth) and the **ligaments** removed, and it sits **perfectly straight** (no tilt) unlike the loosejaw. A **white, non-glowing lure** curves up from its lower jaw (`drawDragonfish` in `src/scenes/evolution.js`).
- **ANIMATION CENTER anatomy labels** — press **ENTER** in the ANIMATION CENTER to overlay **callout labels** pointing to the selected creature's parts (mantle, lure, photophores, protrusible jaw, inflating stomach, oar pelvic fins, …); the label data lives on each `ANIMATIONS` entry (`src/engine/animations.js`, `src/scenes/animations.js`).
- **HATCHERY** — a new main-menu screen (`src/scenes/hatchery.js`) that **combines two dive buddies** into one **hybrid hatchling** for `HATCHERY.cost` (250) sea coins. Pick **PARENT A** and **PARENT B**, press ENTER to hatch, and the hatchling becomes your equipped DIVE BUDDIES companion. The hybrid **combines the parents' traits into one creature** — parent A's model with **parent B's signature animated part drawn over it** (its exact part, not its whole body) — so a cuttlefish parent contributes **only its mantle fin**, replacing the fish's fins; a **shrimp** parent adds **antennae and black dot eyes** laid over the base creature's eyes; a **squid** or **octopus** parent adds **wavy tentacles** (so a fish parent grows them); and a **turtle** or **nautilus** parent turns the body into a **shell** with the original head poking out (the nautilus hood sits above the head); other buddies contribute a matching feature (fin, lure, shell, spikes, …), and a **ghostfish parent overlays an identical translucent double** of the hybrid model (with a vertical ghost wash that grows to fit large models like the MEGASQUID), so it reads as a ghost. Its **name fuses the two** (e.g. **snowfish + ghostfish = GHOST SNOWFISH**). `companionByKey('hybrid')` + `drawHybrid()`/`hybridLabel()`, saved under `HATCHERY_KEY` (`src/engine/companion.js`).
- **Two deep-sea dive buddies** — the **MINI STOPLIGHT LOOSEJAW** and **MINI BLACK SWALLOWER** join the DIVE BUDDIES catalog (granted by PLAYPASS 8), drawn with their real deep-sea bodies (`drawLoosejaw` / `drawBlackSwallower`), and usable as hybrid parents in the HATCHERY (`src/config.js`, `src/engine/companion.js`).
- **FAVOURITE CREATURE** — a new main-menu screen (`src/scenes/favorite.js`) that lets you pick your **favourite creature out of every entry in the codex — playable or enemy**. It browses the `SEA_FACTS` names (with a portrait of each via `drawCreatureIcon`), saves the choice under `SETTINGS_KEY.favorite`, and shows it on the main menu and on the screen itself.

- **Your favourite now does something** — the creature you pick on the FAVOURITE CREATURE screen actually shows up in the game: **FINN** knows it (ask him "my favourite creature" and he answers from your choice), the **SEA FACTS** board opens on it with a ★ star and a "YOUR FAVOURITE" tag, and it becomes an equippable **FAVOURITE** row on the shop's DIVE BUDDIES shelf that draws that creature's own body as your dive buddy (`src/scenes/chat.js`, `src/scenes/seafacts.js`, `src/engine/companion.js`).

## November 13, 2026

The **CUTE MODE** comfort switch (replacing REDUCE MOTION), the **EEL TOY** chase that storms PlayToy's final hold, a gentler CONFETTI RUSH, the PET NAUTILUS reborn with the dive-buddy and playable look, the **MUTANT HORRORS** submenu of ten flesh-horror tanks, three new **playable-creature tanks** (MANTA RAY GLIDE, COASTAL TANK, HERMIT CRAB HOLD), four new original tanks (THE LIGHTHOUSE, THE PRESSURE, THE CLEANER STATION, THE MIGRATION), the **THE TWILIGHT TANK** glow-stealth swim, the **THE GOBLIN DEEP** black-water hunt where you play the loosejaw, and the red-sparking **CHAOS** color with its chaos trinket variants.

- **UNDO DELETED TRACK** — the TRACK BUILDER's **CLEAR** now banks the cleared instrument track, and a new **UNDO TRACK** button (or **Z**) restores the **most recently deleted track**; the button lights up whenever a deletion is waiting to be undone.
- **Cuttlefish species** — the cuttlefish is named in the LORE and SEA FACTS as the **giant Australian cuttlefish** (*Ascarosepion apama*).
- **THE HAGFISH BLOOM** — a new original tank (an original Blind Monster Horror Game scent-stealth swim): you play a plain **gray Caridean shrimp** in a one-way current, and a **blind knot of eyeless hagfish** hunts by **scent alone**. Fast strokes and fear pump your **SCENT** into the water; wash it off in the **CLEAN** upwelling columns, and **SPACE** drops **CHUM** to bait the bloom onto a richer plume. Three lives, checkpoint respawns, a CUTE-MODE scare card, and its own record.
- **FINN answers freely** — the AI CHAT CPU no longer returns canned strings: he **composes** every reply in his own voice (randomized openers, asides and sign-offs) and **improvises** a custom answer whenever he has no knowledge-base file on the topic.
- **FINN is much smarter** — his chat got a full brain upgrade while staying sunny and silly. The matcher now tokenizes messages (with a fuzzy typo pass), weights phrases and multiple distinct matches, and avoids repeating recent answers. He also **remembers your name** ("my name is ..." / "what's my name"), solves **simple arithmetic** ("what is 2 plus 2"), tells **jokes** and **riddles** (and answers his own when you give up), reacts to your **mood** and your **wins**, shares **tips** and **recommendations**, fields **existential** questions ("are you real?", "do you dream?"), and **follows up** when you say "tell me more". Still fully local — no network.
- **New creatures in the codex and FINN** — the HATCHETFISH, STOPLIGHT LOOSEJAW, GOBLIN SHARK, HAGFISH (bloom), MUTANT MORAY EEL, PISTOL SHRIMP, CLEANING SHRIMP and LANTERNFISH now have SEA FACTS entries, the DOLPHIN, SEA TURTLE and MANTA RAY join LORE's THE DIVERS, the loosejaw/bloom/mutant moray join THE HAZARDS, and FINN's knowledge base covers all of them (with word-boundary matching so e.g. "hatchetfish" no longer gets confused with hats).
- **SIX NEW REAL-FISH TANKS** — six original tanks built around real species (`src/entities/realfish.js`): **THE ARCHER'S MANGROVE** (play an **archerfish**, spit water jets to knock insects off the branches, dodge a **needlefish**), **THE THRESHER'S LAGOON** (play a **sardine**, graze krill and dodge the **thresher shark's** whipping tail), **THE SAWFISH FLATS** (play a **smalltooth sawfish**, sweep the toothed rostrum through the sand past a **bull shark**), **THE TIDE-POOL WALKER** (play a **mudskipper** that hops onto the mud and dives back to shake a shore **crab**), **THE FROGFISH GARDEN** (play a **frogfish**, camouflage and wave the lure to draw prey past a **green moray**), and **THE SUNFISH DRIFT** (play an **ocean sunfish**, surface to gulp air between grazing **moon jellies** while a **sea lion** bats you). All six join CHOOSE TANK and the records, with LORE entries, nine new SEA FACTS (archerfish, thresher shark, sawfish, mudskipper, frogfish, ocean sunfish, needlefish, bull shark, sea lion), codex portraits and FINN entries.
- **THE EVOLUTION TANK** — a new choice-and-evolve tank. Pick a **REGION OF DEPTH**, a **CATEGORY** and how many **LIVES**, then start as the smallest creature in your line and **eat to evolve**, growing bigger and faster with each form. Four real lineages to grow up: **CARTILAGINOUS** (COOKIECUTTER SHARK → STINGRAY → REEF SHARK → HAMMERHEAD → GREAT WHITE), **EXOSKELETAL** (COPEPOD → KRILL → SHRIMP → CRAB → LOBSTER), **BONELESS** (JELLY → OCTOPUS → SQUID → CUTTLEFISH → GIANT SQUID) and **DEEP SEA** (GLOWING PLANKTON → HATCHETFISH → LOOSEJAW → DRAGONFISH → SPIDER CRAB). Reach the final form to win, but a **predator** stalks the region until you are grown and a catch knocks you back a form.
- **Creature portraits in LORE and SEA FACTS** — every codex entry now shows a picture of its creature beside the text (`src/engine/codexicons.js`). Each name maps through a keyword table to its in-game body draw (shark, stingray, squid, shrimp, kelp crab, moon jelly, nautilus, cuttlefish, manta, hermit crab, dolphin, sea turtle, moray eel, oarfish, hatchetfish, stoplight loosejaw, goblin shark, megasquid), the ANGLERFISH now uses its own body draw, with small hand-drawn portraits for the HAGFISH and LANTERNFISH, the six real-fish tanks' creatures (archerfish, needlefish, sawfish, mudskipper, frogfish, ocean sunfish, sea lion) joining the table, and a generic fish for anything else. Portraits are clipped into a round frame and forced to the neutral skin, so the codex art never inherits your equipped color.
- **MEME MODE names the creatures** — while MEME MODE is on, the creatures are renamed wherever a name is printed (the SEA FACTS board, the LORE codex, and the SHOP's creature shelf): the shark is **SHIRCK**, the stingray **WATER PANCAKE**, the squid **SQUITT**, the shrimp **SHROMP**, the crab **CROMB**, the jelly **JIGGLE BLUB BLUB**, the nautilus **VERY OLD SQUITT**, the cuttlefish **THAT ONE TOY LOOKIN SQUITT**, the dolphin **AIR BREATHING FIH** and the turtle **TURDLE** — and everything else becomes **FEH**. The real names stay in the data (only the display changes), and turning MEME MODE off restores them. `memeName()` (`src/engine/meme.js`) drives it.
- **SACABAMBASPIS REEF RUSH skin** — a MEME-MODE-only skin added to the REEF RUSH — ENDLESS ladder (2000 m). Equipping it draws the REEF RUSH fish as a goofy **Sacabambaspis** (the flat oval-bodied Ordovician jawless fish with small eyes beside two nostril dots, an upside-down triangle mouth, a little blush and four gill holes) via `drawSacabambaspis`. It is **REEF-RUSH-only** (`rushScope`): it never colours your diver in a normal dive, `skin.js`/`rushShopLadder()` hide it when MEME MODE is off, and it is granted/equipped like the other RUSH skins when on.
- **REEF RUSH SHOP form tabs** — the REEF RUSH SHOP is now split into a **tab per portal form** (FISH, STINGRAY, ZIP EEL, CRAB, URCHIN, JELLY, NAUTILUS, MANTIS SHRIMP, CUTTLEFISH). Besides the FISH tab's RUSH colors, each form tab can wear a cross-over creature skin: the **ZIP EEL** can become a **STOPLIGHT LOOSEJAW**, the **NAUTILUS** an **AMMONITE** (`src/entities/ammonite.js`), the **STINGRAY** a **DOLPHIN** and the **URCHIN** a **PUFFERFISH** (`drawPufferBody`). Picks are stored per form under `SHOP_KEY.rushForm` and only change that portal form's look inside REEF RUSH.
- **REEF RUSH SHOP** — a new screen (opened from the REEF RUSH — LEVELS shelf) that turns your farthest **REEF RUSH — ENDLESS** run into skins: eight original **RUSH** colors (**BLUE** 250m, **LIME** 550m, **PINK** 900m, **GOLD** 1300m, **VIOLET** 1800m, **TEAL** 2500m, **CRIMSON** 3300m, **VOID** 4400m). The farther you run, the more are granted (banked automatically with an in-run **UNLOCKED** callout), the shop shows each skin's distance bar and equips the ones you own, and the main SHOP lists them as EARN IN REEF RUSH — ENDLESS (it will not sell them).
- **REEF RUSH — ENDLESS triple shells fixed** — the classic-course `shellstair` (three shells) and the boss-gate cluster were impossible to clear: shell heights now cap to the height one jump can clear at the current speed, the stair shells sit 18px apart at physics-capped heights (a rising 0.5-0.9 stair) that leave a comfortable jump window, and the boss gate spaces its shell/ceiling-shell/rock 260m apart.
- **THE OARFISH** — a new original tank: a minimalist crossing across open blue where a colossal **OARFISH** (a silver ribbon longer than the tank, crested in red) drifts through, and its **lateral line** reads the water you push. Swim fast while you are on its line and its alert builds until it whips around and sweeps you aside; a slow, quiet stroke lets it settle. Cross to the open water.
- **THE WHALE FALL** — a new original tank: a dead whale lying on the seafloor as one giant **lump of grey-pink blubber** — closed eyes, a long crooked mouth, and pink **flesh-coloured tears** (some showing thick white ribs) — where you play a **Japanese juvenile spider crab** that **climbs the whale** picking **scraps** off the corpse while a **SIXGILL SHARK** circles and lunges at anything in the open. Your only cover is the **tears**, so tuck into one to go unseen. Pale-pink **HAGFISH** \u2014 lone eels with tiny vestigial white eyes, two stumpy antennae and a diamond tail \u2014 lurk inside the whale's blubber and **burst out of the carcass lumps** when you near (timed bursts too), snagging you (mash to wriggle free) until the sixgill arrives. Pick the carcass clean and reach the far ledge.
- **THE GOBLIN DEEP** — a new original tank where **you** are the **STOPLIGHT LOOSEJAW** (the same light-hunting model as the twilight tank's hunter, `drawLoosejaw`, and the same bite animation, its body lit by three rows of small blue photophores). It is pitch black, and small **SQUIDS** drift around you invisible — red light is invisible to them, and without a chemical only **SHRIMP** carry it is invisible to you too. Eat **shrimp** to fill your **STOPLIGHT METER**, then press **E** to switch your **RED RAY** on (E again to switch it off): a beam of red light that **reveals the deep-sea squids ahead** so you can snap them up. The ray is a beacon to a **GOBLIN SHARK** (a pale greyish-pink blacktip-shark body with dark-tipped fins, a super flat leaf rostrum and dark black circle eyes); it is **slow** enough to outswim but swims in close to **shoot its jaws out and chomp** a very short range. Eat a full tally of squids to survive. The red ray stays level (it does not swing up or down when you swim vertically).
### Game features
- **CUTE MODE** — the SETTINGS switch that replaced REDUCE MOTION makes the whole sharkquarium adorable: every creature wears blush and a floating heart, every enemy model (anything that is not the diver) instead wears a big-eyed, smiling cartoon face that blinks, a soft pink glow drifts over the water, and the horror tanks' jump scares give way to a pastel, big-eyed card with a friendly caption instead of the dark zoom. It also damps the screen shake, zoom, and flash, so it does the job REDUCE MOTION used to do — a saved REDUCE MOTION preference carries over to CUTE MODE.
- **THE EEL TOY** — PlayToy Exploration's final hold now wakes the **EEL TOY**, a huge stitched plush eel whose face has come apart: its button eyes are ripped out and dangle by threads, its lips are torn off to bare pink gums and interlocking teeth, and stuffing leaks from the seams. Crossing into the hold sets it rippling after the diver to the surface hatch, lunging in bursts and sweeping its long body; a catch plays a zoom-in scare and returns the diver to the stretch's checkpoint. Fire the **ELECTRICONDUCTOR** anchor into the chase's live circuit to stun it, or the **PRESSURE** anchor into the cargo latch to drop a crate and stagger it; a chase bar in the HUD tracks how far the diver has left to run.
- **CONFETTI RUSH rebalance** — because the shark is locked to one lane and can only steer up and down, every star and popper now drops down that lane instead of across the whole width, and both fall a little slower, so the game is won with well-timed vertical dodging rather than a sideways chase you cannot make.
- **PET NAUTILUS restyle** — the PETS TANK's nautilus now draws with the same body as the playable NAUTILUS and the mini-nautilus dive buddy, instead of its own simpler shell.
- **CHAOS VOLT CRACKLE trail** — a new PLAYPASS 7 swim wake (so the pass now grants six wakes): red chaos electricity instead of a plain electric crackle. The swimmer crackles with red sparks, and the lines left behind are glowing red lightning that crackle and spark in place for two seconds before fading; lines are only laid down while you swim, so they never pile up on a stationary diver.
- **CHAOS KARAMBIT aura** — a new 340-coin AURA: three curved karambit claws which reuse the KARAMBIT AURA's own look, built to glitch. From time to time — and mostly not at all — it slips into a short burst where a transparent blue shadow flickers along the diver's left edge and a red one along the right, or (the other half of the time) each edge flickers a random color of its own, while the blades jitter and snap sideways.
- **CHAOS color & chaos variants** — a new 2500-coin COLOR that is pure glowing red all over (one pulsing red for body, fins, and belly, with no separate belly shade), its eyes invert (white part black, pupil white), its tail pulses black, and its edge flickers with short red lightning bolts, so the diver glows like the CHAOS VOLT sparks. The shop's chaos variants wear the same red crackle: **CHAOS STINGRAY HAT** 340 and **CHAOS JACKET** 340 are red-glow redraws of the STINGRAY HAT and NEON JACKET.
- **Idle animations & blinking eyes** — while the diver drifts still, the playable creature runs an idle routine that alternates a slow full backflip (upright → upside down → upright, ~3.7s) with blowing a huge bubble that grows, pops in a burst of droplets, and makes its eyes flinch shut from the surprise (backflip, then bubble, then backflip, and so on). Every creature's eyes also blink from time to time.
- **Nautilus instant flip** — the nautilus now mirrors instantly to face its swim direction like the shark and other creatures, instead of the smooth horizontal squash.
- **Realistic creature models** — every playable creature now renders with the detailed, natural look the nautilus already had: the **shark** gets a symmetrical leaf-shaped body with counter-shading, back-slanted triangle fins, five gill slits, a lateral line, and a nostril, plus a short trapezoid tail stalk capped with its original two-lobe tail; the **stingray** gets a graded disc, wing-margin highlights, spiracles, and a barbed tail spine; the **squid** gets a torpedo mantle with rear fins, 8 arms plus 2 long tentacles, large eyes, and chromatophores; the **arctic shrimp** gets a segmented carapace with a rostrum, long antennae, walking legs, swimmerets, and a tail fan; the **kelp crab** gets a spined carapace, two pincer claws, four pairs of walking legs, and eyestalks; and the **moon jelly** gets a scalloped bell, radial canals, four horseshoe gonads, fine tentacles, and frilly oral arms. All still honour the equipped COLOR via `playerColor()`.
- **RED RAY** — a new catchable TRENCH EXPLORE stingray (bright red body, pale-red spots, deep-red tail), scooped up in the net to unlock its free color like the other rays.
- **ACHIEVEMENTS** — a new main-menu board with fourteen trophies (first win, first clear, REEF RUSH, BOSS RUSH, a MUTANT HORRORS escape, the PlayToy surface, a TRENCH EXPLORE ray, ten cosmetics, 5,000 coins, a 100 score, a DAILY DIVE, SEA FACTS, five coastal eats, and the cuttlefish set), banked under `sharkquarium.achievements` and unlocked automatically as you play.
- **DAILY DIVE** — a main-menu entry that starts a fresh date-seeded endless dive with a mutator rotating by the day, banked as its own record.
- **MUTANT HORRORS** — a new tank-select submenu with **ten original flesh-horror tanks**: **THE GRAFT** (a stitched hunter that welds limbs off corpses — burn the corpses with the torch), **THE BROODMOTHER** (births spawn waves; hold the action on the incubator sac to cauterize it), **THE SPINE** (an eyeless vertebral hunter that hears movement, so go still), **THE EYESWARM** (a mass of eyes with one blind cone to hide in), **THE MOULT** (sheds decoy skins and re-appears), **THE PUPIL** (a colossal eye whose blink rearranges the gates), **THE MUTAGEN** (an exposure meter that buds grotesque parts on your diver; purge at the scrubbers), **THE HARVEST** (free the grafted divers before the collector reaches you), **THE SOMATIC** (flesh walls digest the still — vent heat and keep moving), and **THE TERATOMA** (sever four numbered veins in order under a timer). Every diver gets three lives, checkpoint respawns, and a CUTE-MODE-friendly scare card.
- **MANTA RAY GLIDE · COASTAL TANK · HERMIT CRAB HOLD** — three new playable-creature tanks on the tank-select list. **MANTA RAY GLIDE** (`src/entities/mantaray.js`): fly a manta ray (a large rhombus body whose long sides stick out as wings, two cephalic lobes, small wide-set eyes, short tail) through open water, **holding UP / SPACE to flap** against a steady sink, threading pulsing **rings** for points past drifting **jellyfish**; reach OPEN WATER to win. **COASTAL TANK** (`src/entities/cuttlefish.js`): the brightest, bluest tank, with **turtles** drifting through the background and **coral** along the seabed, where the **cuttlefish** wears a translucent blue **mantle fin** along its mantle edges and a solid **triangle-shaped clump of short tentacles** at the front that **frays open as it swims or shoots**; its two body-colored **feeding tentacles** stay hidden inside the clump until **SPACE** shoots them out — diamond **sucker pads** first — to hook prey and **drag it to the beak**. There is no shark here — instead the **sea slugs** grow frightened and **poison the water** if you approach while visible (hold **RIGHT CLICK** to camouflage first), and the **small octopuses** (using the kelp forest's own octopus model) **jet away** unless you **hold E** to **HYPNO-COLOR-PULSE** them still — while pulsing, a **bright-blue gradient wave ripples across** its body, and its translucent blue fin runs along **every edge of the mantle**. Eat slugs and octopuses on the way to the WARMER WATERS, hiding from the **pods of five dolphins** that sweep the shallows — camouflage and blend into the **coral** until they pass, or be eaten. **HERMIT CRAB HOLD** (`src/entities/hermitcrab.js`): a seabed crawl where the crab **swaps shells with E** (bigger shells raise **armor** but slow it) to crack past **urchins** — a shell too thin means a catch, a strong one bounces you off; reach SAFE ROCK to win. Each runs third-person with three lives, checkpoint respawns, a CUTE-MODE-aware scare card, and its own record.
- **CUTTLEFISH AS A DIVER** — the cuttlefish is now a selectable diver everywhere you pick one: MYSTERIOUSLY QUIET, THE WATCHER, THE TRENCH MOUTH, the LABYRINTH diver picker (both players), the AQUARIUM BUILDER's dive picker, and the shop's CREATURE browser, with its own LORE entry under THE DIVERS.
- **DEAD CALM** — a new original tank: a side-scrolling platformer where you play a **PISTOL SHRIMP** (solid red with white stripes and one **giant claw**). Run with A/D, **jump high** with W/UP and hold it to flutter your swimmerets and sink slowly; drag the **mouse** to raise/lower the claw and **left-click** to fire a **cavitation bubble** — silent in flight, but it **pops in a small shockwave** (or bursts on the mutagen) that knocks **sea snails and smaller shrimps** off the stone causeways, and the pop is what the hunter hears. The channel's old sea floor is now **natural, accidental mutagen** — landing in it is fatal — and the hunter is a **giant mutated moray eel** \u2014 grown huge, its **eyes dissolved away by the mutagen** \u2014 that is now **much longer, bigger, and faster**, its body trailing a long chain of **tapering segments** that follow its own path like a great sea serpent (evenly spaced so they never clump on themselves); it **hears the whole map** and, when a splash rings out, **courses five times faster than the echoeel swims** toward the **most recent splash**; it **roams the whole channel** when idle and, when a splash rings out, it stops short, **dives down into the sludge, then erupts out in a rainbow arch** — its whole segmented body curving through the air — and **lands right on the splash**; the stone causeways sit **low** so it rides right alongside you, and it only **jumpscares when the arch jump ends** right on you — whether the **mutagen has you trapped** or you are just **standing on the splash/pop** it aimed at (its head also stays right-side up when it faces left). The cavitation bubble now has **no cooldown**. Running and jumping are **silent**; the only noises are your bubble **popping** and the creatures you knock into the sludge, so you stay undetected up on the stones and can redirect it by making noise elsewhere. Three lives, checkpoint respawns, a CUTE-MODE scare card, and its own record.
- **LOCAL ACCOUNTS** — the main menu has an **ACCOUNT** screen where you **CREATE AN ACCOUNT** with a name and a **custom password**, which snapshots and saves your progress on this device. Saved accounts appear as a **list you can pick from** (`SIGN IN: NAME`), and you key that account's password to sign in (a wrong password is refused and does not restore anything); **SAVE PROGRESS** banks it, **DELETE ACCOUNT** removes an account (picking from a list when signed out), **LOG OUT** ends the session, and a **FORGOT PASSWORD** option reveals the exact password you keyed for an account. To use an account on a **different device**, **GET TRANSFER CODE** shows a **random sequence of numbers** on screen and you key that number, plus the **password**, into **ENTER TRANSFER CODE** on the other device — the number is your save encrypted with your password, so **the correct password is required** to claim the account and its progress. Everything is stored locally — no server — and the password gate is a salted hash on the device.
- **THE TWILIGHT TANK** — a new original tank: a free-swimming glide through the mesopelagic twilight zone where you play a **HATCHETFISH** (thin, silvered, a row of **photophores** along the belly) steering with **WASD / arrows**. Your **GLOW** climbs the harder you swim, and the tank's hunter — a **STOPLIGHT LOOSEJAW**, a long, thin jet-black dragonfish (it borrows the echoeel's tapering tail and tail fin, but has no dorsal spikes and carries small rounded black back fins beside the tail on each side, a long, thin super-dark-gray rounded dorsal fin spanning its whole back that ripples with its body, and a black pizza-slice tail fin whose point meets the body at the tail junction) whose flat **leaf-shaped** head, its **upper jaw drawn deep** for the stoplights, is drawn at **roughly six-tenths the body's scale** and pinned by its **snout**, with a long lower jaw hung in an **underbite** that juts past the snout (poking a little past the body's front tip) and angled so the snout points **forward and up at about 30°**, with small **fins at the back of the head** behind the jaw joint, and its **lower jaw hinged at the back of the head** hanging open with an **underbite**; its head pivots at the **head-to-body junction**: on the strike the **head/upper jaw leans backward** (the mouth gapes), the **jaws snap fully shut while still leaned back**, then a fast clamp on you (or a swallow of a decoy) with the head **swinging smoothly back to normal right away** (the open jaw juts forward past the snout) so the head leans back while the thick black **lower jaw hangs constantly open from the back of the head** (open, jutting just past the upper jaw), both jaws lined with small sharp teeth and longer front fangs (the lower jaw's underbite is a tooth shorter, tipped by one longer tooth curved inward), with a **solid red eye (a solid red disc around a big black pupil)** set near the snout of the leaf, a **glowing red bean-shaped stoplight under the eye** (its curved edge facing the eye) and, **behind the eye**, a smaller **glowing lime-green circle** stoplight that pulse alternately \u2014 one fading to black as the other glows, and three rows of small **bright-blue spots** down the body — **hunts by light**, charging whatever glows brightest (it senses your glow from anywhere in the tank and swims at double speed, and its short offset teeth interlock without overlapping). Move slowly to stay dark, or **press SPACE to FLASH**: the hatchetfish dumps its light into a **drifting decoy** and goes **counter-illuminated** (briefly dark, off the hunter's eye) while the loosejaw chases and **snaps the bait**. Ambient **lanternfish** scatter when it nears. Three lives, checkpoint respawns, a CUTE-MODE scare card, and its own record.
- **A WHOLE REEF OF NEW CONTENT** — a big expansion pass:
  - **Divers**: the **DOLPHIN** and **SEA TURTLE** join the **CUTTLEFISH** as playable creatures everywhere a diver is picked (the quiet/watcher/mouth tanks, both LABYRINTH pickers, the AQUARIUM dive picker, and the shop's CREATURE browser — now ten creatures).
  - **THE POD**: a new 1P minigame where a pod of five dolphins sweeps the arena and you must duck inside the coral clumps to survive every sweep.
  - **SPRING & SUMMER seasons**, each with its own minigame: **BLOSSOM DRIFT** (SPRING — catch falling blossoms, dodge bees) and **SUNSET SURF** (SUMMER — hold to rise over rocks to the shore).
  - **REEF RUSH — ENDLESS**: a procedural, no-finish revive of REEF RUSH with ramping speed and periodic **boss waves**, recorded separately, plus a **CUTTLEFISH** portal mode.
  - **Coral & aquariums**: **CORAL FAN**, **CORAL SPIRE**, and a **REEF GARDEN** habitat join the AQUARIUM builder palette.
  - **PLAYTOY BUILD-A-TOY**: collect four scattered toy parts to assemble a friendly toy that trails your diver (and the EEL TOY chase is billed as the **TOY BOSS**).
  - **COLORBLIND HAZARDS**: a new SETTINGS switch that swaps red/green danger cues for high-contrast colors and stamps shape-coded chevrons on the jellyfish hazard.
  - **Aura stacking**: a shop **AURA STACK** row lets a second aura ride along with your equipped one.
  - **Cuttlefish cosmetics**: a **CUTTLEFISH AURA** (three orbiting cuttlefish), a **MINI CUTTLEFISH** dive buddy, plus new **PLAYPASS 10 — CUTTLEFISH PACK** (hat, plushie, aura) and **PLAYPASS 11 — DEEP CORAL** (a DEEP CORAL color).
  - **WEEKLY CHALLENGE**: a week-seeded endless dive, plus a hidden DAILY DIVE day-streak coin bonus.
  - New **achievements**: FACT FINDER, INK & HIDE, and CUTTLEFISH CLAD; and more **SEA FACTS** entries (dolphin, moray, megasquid, sea turtle, anglerfish, the shop).
- **SEA FACTS** — a new main-menu board that teaches real-world trivia about each playable creature (shark, stingray, squid, arctic shrimp, kelp crab, jellyfish, nautilus, cuttlefish, manta ray, and hermit crab), one creature at a time with Up/Down to browse and Enter to turn the page.
- **CUTTLEFISH TRIO** — the cuttlefish joins the collection three ways: a **CUTTLEFISH HAT** (a perching red cuttlefish with a blue mantle fin, dark damascus stripes, and a forward tentacle triangle — a 170-coin HEAD trinket), a **PLUSH CUTTLEFISH** (a pass-exclusive PLAYPASS 5 ragdoll plushie with button eyes and stitched seams), and the **CUTTLEFISH** itself as the newest official creature in the shop's CREATURE browser.
- **THE LIGHTHOUSE · THE PRESSURE · THE CLEANER STATION · THE MIGRATION** — four new original tank-select levels (THE CLEANER STATION now stars a translucent orange **cleaning shrimp** servicing the stingray tank's morays — each wears a **speech bubble**: a shrimp bubble means clean its face, a mouth bubble means it is hungry and must be avoided). **THE LIGHTHOUSE**: a flooded tower climb where a rotating lantern **beam** fills an **EXPOSURE** meter while it covers you (drains in shadow) — dodge the falling debris and reach the lantern room. **THE PRESSURE**: descend a trench as a depth-scaled **PRESSURE** meter climbs, resting inside **air vents** to bleed it off while trench fish ram you; reach the floor. **THE CLEANER STATION**: swim onto clients and hold **SPACE** to pick their parasites clean before loose parasites burrow in or the patrolling **lurker** catches you; clean every client. **THE MIGRATION**: ride a current while staying inside the drifting **band of the school** (stray and a SCHOOL meter drains) past hunters breaking the line; reach the spawning grounds. Each has three lives, checkpoint respawns, a CUTE-MODE-aware scare card, and its own record.
- **DRESS UP BATTLE (2P)** — a new MINIGAMES entry. Before the match it opens an in-game replica of the SHOP (COLOR, CREATURE, HEAD, BODY, TRAIL, AURA, COSTUMES, PLAYER — no playpasses) so both divers dress to fight; it is a private dress-up, so it never changes the main shop avatar or spends coins. Whatever cosmetics they wear become their weapons. **J / 1** lunges (a **CHAIN-FIN** costume turns it into a heavier saw-lunge) and **K / 2** deploys the equipped aura for 5s. **Weapon auras** (KARAMBIT, CHAOS KARAMBIT, TRIDENT, SWORD) shoot: trident/sword fire straight shots then cool down, while the karambits are thrown one at a time and boomerang back on their loop (no cooldown). **Living auras** (OCTOPUS, STINGRAY, SHARK, EEL) unleash an attack creature — drawn in the matching octopus, stingray, shark, or eel model with its natural colors, turning to face the way it swims — that chases and chips the opponent (it can be killed) and turn the owner's lunge into an unstoppable dive. **Power auras** do power damage: **NEON** instantly kills aura creatures and blinds the opponent, **SNOWFLAKE** freezes the opponent's tail (slowing them), and **BUBBLE** knocks them back. **Food costumes** (SHARK FIN DISH, SAMBAL STINGRAY, GRILLED SQUID, PRAWN CRACKERS) auto-heal their eater when health runs low, and an equipped trail stuns the opponent on a fast contact. Reduce the other diver to zero HP to win.

### Game systems
- **Hi-hat fix** — the composer's hi-hat (`DRUM_SOUNDS[0]`) was a 6.5 kHz high-pass at 0.08 volume, so the 8-bit master low-pass (7 kHz) cut it to near silence and it was the quietest drum in the mix. It is now a 4.2 kHz high-pass at 0.18 volume for 0.06 s, so hats sound in the TRACK BUILDER (and MY TRACK) in every mode.
- **Cute engine** — a new `src/engine/cute.js` owns the CUTE MODE flag (`setCute`/`cute`), an `Entity`-level overlay in `entity.js` that gives the diver blush-and-heart and gives every non-player creature (radius >= 16) a blinking `drawCuteFace()` cartoon face, a global pastel grade drawn by `Game.renderScene` (`renderCuteGrade`), and `renderCuteScare()` — the pastel big-eyed card the horror scenes (`quiet`, `watcher`, `mouth`, `prehistoric`, and PlayToy's chase) show in place of their dark zoom. `motionScale()` now returns 0 while CUTE MODE is on, and the abyss, reef-queen, trench-explore and labyrinth renders route their shake and flash through it.
- **Eel toy chase systems** — `PLAYTOY.chase` and `PLAYTOY_EEL` config plus `src/entities/eeltoy.js` (an `Entity` with `flat3D`, radius 76, and `santa`-hat support) drive the chase, with scene-owned `chaseLatches` resolved through `tetherHit()`/`attachTether()` and speed scaled by the mutator's `enemySpeedScale`; the eel toy joins `firstPersonSprites()` so the raycaster renders it.
- **Mutant horror scene** — `src/scenes/mutant.js` (one `MinigameScene` running all ten variants off `MUTANT`/`MUTANT_VARIANTS` and a `params.variant`) plus `src/scenes/mutantselect.js` (the submenu) and a tank-select row. A scrolling dark facility with drop-gap walls, checkpoints, three lives, a scare phase, and one grotesque hunter (`updateHunter`/`drawHunterLocal` switch on the variant); per-variant gimmicks live in `setupVariant()`/`updateVariant()`. `recordMode()` returns `mutant_<variant>` with matching `MODE_LABELS` and a `RECORD_GROUPS` entry.
- **Neon-jacket eye fix** — the nautilus's eyes are now drawn on top of the NEON JACKET (a shared `drawNautilusEyes()` helper, redrawn when `activeBodyKey()` is `neonjacket`), so the jacket no longer covers them.
- **Chaos-volt trail renderer** — `src/engine/trail.js` gains `drawChaosVolt()`: the swimmer crackles with short red bolts drawn on its body each frame, and each burst spawned while moving lays a big spark down the middle of the path with a random one-to-three smaller sparks scattered unevenly on either side (varied lateral distances, along-path offsets and sizes, so the wake reads more like natural crackle than a pattern); each line lives ~1.7s, then fizzles into a couple of smaller child sparks (short-lived, no children of their own) that fade out. When the diver takes a hit (`invulnerable` spikes) the whole wake flares for half a second — every bolt swells and adds a hot white core — and a registered flare handler plays a high-pitched zap. The renderer was optimised for smoothness: each bolt builds one path and re-strokes it (two base strokes instead of three, a third only during a flare), spark pruning happens in place with no per-frame `filter`/array churn, and the cap sits at 44 lines, all without `shadowBlur`.
- **Chaos-glitch aura system** — `src/engine/aura.js` gains `drawChaosKarambitRing()` and a per-entity `chaosGlitch()` scheduler (a `WeakMap` of window timers): every ~1.5–5s it opens a short 0.14–0.74s glitch window in one of two modes and picks its colors, so the effect reads as occasional rather than constant. `drawChaosShadows()` paints the offset translucent shadow blobs (blue/red by default, or per-side random hues in the other mode), and the blades shift by a per-frame jitter while the window is open.
- **Chaos skin & accessory variants** — `src/engine/skin.js` gains a `chaos` special: `skinColor()` returns one pulsing pure red for body/accent/belly (no separate belly), a pulsing black `tail` and red `tailOutline`, `shadowEyeColor()`/`eyeLight()` invert the eyes (white part black, pupil white), and `drawChaosCrackle()` flickers short red lightning bolts around the diver; `chaosActive()` exposes the state. The shark's rear fin uses the `tail` slot so it pulses black, and its other fins follow the accent so the whole creature reads red. `src/engine/accessory.js` gains `drawChaosJacket()` and `drawChaosStingrayHat()` — red-glow redraws of the neon jacket and stingray hat — sharing a `drawChaosCrackle()` edge helper. The smoke suite buys the CHAOS color and checks both chaos trinkets appear in their slot catalogs.
- **Idle & blink systems** — `Entity` (`src/entities/entity.js`) gained a per-entity `blinkSeed` and an idle state machine (`updateIdle`) that drives `flipAngle`, `bubbleGrow`, `bubblePop`, and `eyeFlinch` for controllable players (idle time tracked from velocity in `update()`), plus `drawIdleBubble()` for the huge-bubble idle. `src/engine/skin.js` gained `eyeOpen()`/`eyeOpenFor()` (blink + flinch) and `drawEye()`/`drawPupil()` (which also renders the CHAOS red slit pupil), used by the shark, stingray, squid, arctic shrimp, kelp crab, and nautilus eye draws.
- **Dress Up Battle scene** — `src/scenes/dressbattle.js` (a `MinigameScene`) runs the 2P cosmetics brawl: two `Shark` fighters with per-player wardrobes (rendered by the shared `renderPlayers`/`applyWardrobe`), lunge/aura keys read as raw codes (`KeyJ`/`KeyK`/`Digit1`/`Digit2`), an aura-kind table (`weapon`/`living`/`power`) with weapon styles (karambit boomerang vs trident/sword shots), aura creatures, statuses (stun/slow/blind/knockback), food-costume auto-heal, and trail-stun on fast contact. `ShopScene` gained a `params.battle` mode that hides pass/emote/companion rows and adds START BATTLE (launching `dressbattle`); the minigames menu, `MODE_LABELS`, and `RECORD_GROUPS` list it, and the smoke suite covers the dresser, both fighters' loadouts, the saw-lunge, aura deploy/ammo, neon-kills-creatures + blind, and food healing.
- **Tests and docs** — the smoke suite covers CUTE MODE's setting, the eel toy waking, stunning, catching (scare → checkpoint respawn), and clearing, and the docs (FEATURES, GAME_DESIGN, README, LORE, and FINN's chat) were kept in sync.

## November 9, 2026

Commits `bb00111`, `9d61b13`, `03b5f7a`, `2c2f8bc`, `1aeda1f`, `33faa88`, `454e68f`, `1c5570e`, `80d666f`, `62fb48b`, `f4da99f`, `72bd7a4`, `42bf3d2`, `7bd5ecc`, `ee48834`, `55a5fe7`, `040b3c9`, `3b16533`, `fc9e1c1`, `b1d9104`, `1c41aad`, `fceb7a8`, `bb2c2a1`, `7d5ead1`, `2ff82d7`, `3d25488`, `0c4eec9`, `b62f103`, `f57f898`, `1cd53f8`, `38da212`, `05b59eb`, `51b8b5c`, `715f573`, `ec4fd4a`, and `fc68da6`.

The **MOBILITE** on-screen-controls mode, REEF RUSH demonstration levels with paged briefings, and a large course-builder pass (named courses, free zoom, a slide-out shelf, any-height pieces, fake rocks, and a test-run debug overlay), plus the swing and mantis-shrimp portal modes, gravity portals and a scrub slider, paged LORE, AI CHAT with FINN, MEME MODE, the TAG leaderboard and cosmetics, emotes and the ripcord, the seasonal minigames, and the FRANTIC FRENZY tier.

### Game features
- **MOBILITE MODE** — a new SETTINGS switch draws pressable on-screen W/A/S/D, SPACE, E and ESC buttons (WASD hides in REEF RUSH, leaving SPACE; E appears for the Christmas present games) and injects them as keys. It runs alongside any season, forces 3D, First Person and 8-bit off, hides the course builder, and swaps in a full on-screen keyboard plus ENTER while typing in FINN's AI CHAT or naming players in TAG.
- **REEF RUSH demonstration levels & briefings** — the LEVELS shelf now opens with eight tutorial levels (one per portal mode: fish, stingray, zip eel, crab, urchin, jelly, nautilus, shrimp), and every level shows paged instructions before the run (Left/Right turns pages; the last page starts the level).
- **REEF RUSH full-screen course view** — the builder now renders the course across the whole canvas and opens in a FIT zoom that shows the entire level at once; zoom in and out with -/= or Shift plus the wheel (15%-400%), Z (or the FIT button) snaps to the whole level, and a triangle handle on the right edge (or Tab) slides the item shelf in and out.
- **REEF RUSH course library** — the course builder gains a top course bar: the current course is named and autosaved, `<` / `>` (or `[` / `]`) switch between saved courses, **RENAME** (`R`) renames it, and **NEW** (`N`) saves the current course and starts a fresh one. Courses persist in `sharkquarium.rushcourses`, with the active one still mirrored to the old single-course save.
- **REEF RUSH any-height placement** — every item in the course builder can now sit at any height via a saved per-piece `lift`, adjusted with Shift+Up/Down (shown in the HUD); pieces still snap to the ground, ceiling, or a stacked block by default.
- **REEF RUSH fake rocks** — the course builder adds **FAKE ROCK** and **CEILING FAKE ROCK** pieces: darker decoy blocks that can be stacked on normal rocks (and that normal and ceiling rocks can stack on) but are passed straight through, in both the builder preview and the run.
- **REEF RUSH builder debug overlay** — after a TEST / TEST HERE run, the course builder draws that run's path: a dashed trajectory line, a big blinking red death circle, a red up-triangle at each jump and a red square at each landing (builder-only), all recorded in the builder's own coordinates so the path lines up with the placed course.
- **REEF RUSH swing & jump** — two new portal modes: **NAUTILUS** (the Geometry-Dash-style swing: each click flips gravity in mid-air, but touching the floor, ceiling, or any obstacle kills) and **SHRIMP** (no robot, it just leaps as high as one: a short tap is a low hop, while press-and-hold charges a super-jump on release). Both are placeable in the course builder and usable on MY TRACK.
- **REEF RUSH mantis shrimp & upright swing** — the SHRIMP portal now shows a bright lime-green and cyan **MANTIS SHRIMP** with clubbed forelimbs, pink eyestalk eyes with black pupils, and a long segmented tail; the NAUTILUS swing now keeps its body upright when gravity flips and puffs a visible jet of water and bubbles from its funnel, slanted up when it is about to drop and slanted down when it is about to rise.
- **REEF RUSH gravity portals** — two new builder pieces: **GRAVITY PORTAL** flips your swimmer upside-down and **NORMAL GRAVITY PORTAL** sets gravity back, working in every mode. Drawn as colour-coded rings with up/down arrows. The course builder also gains a **scrub slider** along the bottom of the track (with a goal tick) so you can drag the cursor across the whole course instead of tapping the arrow keys.
- **REEF RUSH — TEST HERE & crab ledges** — the builder gains **TEST HERE** (`T`) to launch from the cursor, spawning the fish on the nearest landable surface, and the **CRAB** portal can now snap onto floating ledges as well as the floor, ceiling, and rocks; a crash still returns to the editor instead of the minigame menu.
- **REEF RUSH — level & MY TRACK polish** — the built-in courses were rebuilt around each swimmer's abilities and made harder, and **MY TRACK** now generates a tougher course that still stays clearable (chords merge to one piece, no stack taller than a jump, obstacles kept a jump apart).
- **LORE pagination** — overfilled codex entries now split onto additional pages, broken after the last complete sentence, turned with ENTER (the panel shows PAGE n/m).
- **MEME MODE** — a SETTINGS switch that overlays every screen with all-original comic pop-up
  words (BONK, BLORP, SPLOOSH, CHOMP, ZOOP, and more), spinning speed lines, a rotating goofy
  caption bar (CERTIFIED REEF MOMENT, SHARK.EXE IS VIBING, etc.), and a MEME MODE badge. Purely
  cosmetic and works in 3D and 8-bit modes; no third-party memes, images, or characters.
- **AI CHAT (CPU)** — a new MINIGAMES screen where you chat with **FINN**, the CPU you dive with. Type with the keyboard; your messages appear right in light-blue bubbles with gray text and FINN replies left in yellow bubbles with black text, both in the game font over the navy Sharkquarium water. FINN gives real answers from a built-in knowledge base covering controls, tanks, minigames, Reef Rush, the seasonal games, the shop and emotes, difficulty, settings, coins, and lore, and now also shares his own favourites and opinions on just about anything (no external service).
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
- **FRANTIC FRENZY difficulty** — a new top difficulty tier far beyond APOCALYPTIC WIPEOUT:
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
### Game systems

- **Mobilite controls** — new `src/engine/mobilite.js` (`setMobilite()`/`isMobilite()`) plus `Game` wiring draws large on-screen key buttons and injects them into `Input` (becoming a full QWERTY + ENTER pad in FINN's chat and the TAG name screen); it forces 3D, first person and 8-bit off and hides the course builder.
- **Course-builder systems** — `rushcourse.js` gains named courses in `RUSH_COURSES_KEY` (`createRushCourse`/`renameRushCourse`/`setActiveRushCourse`), a per-piece `lift`, fake-rock kinds, and base-aware stacked rects; the builder gains FIT/free zoom, a slide-out item shelf, and a test-run telemetry overlay; `RushBriefScene` (`rushbrief`) pages the demonstration levels.
- **Paged LORE** — `LoreScene` splits overlong entries after the last complete sentence and turns pages with ENTER (showing `PAGE n/m`).
- **Chat, emotes, and tag board** — `src/scenes/chat.js` answers from a local knowledge base, `src/engine/emotes.js` and `src/engine/ripcord.js` drive the emote shelf and verlet ripcord, and `src/engine/tagboard.js` persists the tag leaderboard.
- **Meme overlay** — `src/engine/meme.js` (`setMeme()`/`isMeme()`) is drawn by `Game.renderFrame()` in both the normal and 8-bit paths.
- **New tests and docs** — smoke coverage grew for the course library, free zoom, slide-out shelf and test-run debug overlay, the demonstration briefings, the MOBILITE pad and keyboard, LORE pagination, and the new REEF RUSH pieces; FEATURES/GAME_DESIGN/README/LORE/FINN were kept in sync.

## November 8, 2026

Commits `0639120` (REEF RUSH, its course builder, levels, and the track builder), `3b8b7c0` (slopes), `c6f3bc2` (pads on rocks), `a7d6161` (pads on ledges), and `8265b9c` (level piece fixes).

REEF RUSH arrives — the original rhythm-runner with its course builder, hand-built levels, MY TRACK from the composer, and the tone-block TRACK BUILDER — along with slopes and pieces that rest on rocks and ledges.

### Game features

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
  showcases: SUNLIT REEF (fish shell jumps), KELP CROSSING (zip eel — tight weed/rock gates),
  STINGRAY ALLEY and JELLY BLOOM (pillars of ceiling rocks + rocks with a hole to thread), and
  DEEP CURRENT (urchin pillars then a crab run of ceiling shells and shells with gaps, via
  portals). REEF RUSH's hazards and pickups are
  now **SHELL** and **SEAWEED** (ground spikes) plus matching **CEILING SHELL** and **CEILING
  WEED** (hanging spikes), floor **ROCK** and hanging **CEILING ROCK**
  (both stackable blocks), **PEARL** (collectible), the **PRESSURE BUBBLE** — an air pickup that
  grants a free jump-boost when you click while touching it, even in mid-water, with a generous
  hitbox — and the **GRAVITY BUBBLE**, which **turns gravity upside-down in whatever mode you
  are in** (a second one sends you back down), the **GRAVITY BUBBLE PAD** / **CEILING GRAVITY
  BUBBLE PAD** that flip gravity on **mere touch** until another pad is touched, and the
  **THRUST BUBBLE PAD** / **CEILING THRUST BUBBLE PAD** — rhythm-runner jump pads that fire an
  automatic extra jump away from their surface when you touch them — the **FLOATING LEDGE**,
  a thin standable slab you can hang at any height from just above the floor to just under the
  roof, and the **SLOPE UP** / **SLOPE DOWN** ramps that carry the swimmer up and down. The
  stingray, jelly, eel, and urchin are no longer hazards: they are portal **swimmer modes** only.
- **REEF RUSH — swimmer modes** — the portal targets now play distinctly: a **FISH** portal
  turns a transformed player back into the plain fish, **STINGRAY**
  (hold to fly), **ZIP EEL** (the Nautilus Tank's zip-eel head on a body painted with the
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
  the modes (STINGRAY / ZIP EEL / CRAB / URCHIN / JELLY / FISH, each placing a portal with that
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

### Game systems

- **REEF RUSH course model** — `src/engine/rushcourse.js` defines `RUSH_KINDS`/`RUSH_META`/`RUSH_HEIGHTS` and `rushItemRect`, saving to `RUSH_BUILDER_KEY`; `src/engine/rushlevels.js` holds the original levels, progress, and skin unlocks.
- **Track builder and composer** — `src/scenes/trackbuilder.js` plus `src/engine/composer.js` (instruments, `loadComposer`/`saveComposer`, `buildCustomTrack`) feed **MY TRACK** and **RUSH MY TRACK** into REEF RUSH.

## November 7, 2026

Commit `dde8519`.

The seasonal modes (Christmas, Halloween, and New Year), 8-BIT MODE, the snowflake aura, and a scrolling tank select.

### Game features

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
- **Snowflake aura** — a new shop aura that rings the diver with orbiting six-pointed snow
  crystals, a faint icy halo, and drifting sparkles (rainbow-aware like the other auras).
- **Scrolling tank select** — the tank list is long enough to overflow the screen, so it now
  renders in a fixed 11-row window that scrolls (with up/down caret hints) to keep the
  highlighted tank visible; the per-tank best-time badges scroll with it. The reusable
  `SelectList` gained this optional `visible` window.

### Game systems

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
- **Christmas music toggle fix** — `MusicPlayer` keeps the base (non-seasonal) track in
  `source`, ignores resolved seasonal tracks when they are passed back in, and clears
  `source` on `stop()`; scene restores capture `source`. Turning Christmas off now always
  restores the normal theme, even after the Christmas trailer or any dive that had been
  playing the resolved Jingle Bells track.

## November 1, 2026

Commits `fab1561` (the horror tanks, 3D/first-person modes, the replayability pack, and the PlayToy tank) and `8f709ad` (docs sync).

The horror tanks, 3D and first-person modes, the replayability pack (mutators, a boss rush, and a records/time-trial system), the shared water realism pass, and the PlayToy Exploration tank with its Anchor-Pack tool and lore inventory.

### Game features

- **3D MODE** — a SETTINGS switch renders the whole game in 3D: every enemy, bubble, prop,
  and the player is drawn as a shaded extruded volume with a ground shadow (bubbles as lit
  spheres), each scene's background becomes a perspective sky and grid floor, and the
  canvas tilts onto a perspective plane; the toggle persists and re-applies on boot.
- **FIRST PERSON MODE** — a SETTINGS switch below 3D MODE renders every dive and minigame
  as a first-person **raycast** view from the selected creature: a software raycaster of a
  3D room built from the level's walls, with depth-sorted billboards for the enemies,
  bubbles, and props; the mode goes fullscreen and pointer-locks so the mouse looks
  endlessly without edge-sticking, the diver's own body and the cursor are hidden, `W`/`S`
  move forward/back and `A`/`D` strafe relative to the view (never swinging the camera), a
  corner minimap shows the arena. It
  works independently of 3D MODE and persists. (Also fixes a hang
  when first person and 3D MODE were both on entering the labyrinth.)
- **RAYCAST TANK** — a new first-person novelty tank: a Canvas2D software raycaster over a
  procedurally generated wreck maze with distance-shaded walls, a licking cone, and a
  minimap; collect every bubble then reach the exit light.
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
- **QUIET TANK CHECKPOINTS** — a lit **checkpoint mast** at each sector start banks your
  progress; if the ECHOEEL catches you, the jumpscare plays and you **respawn at the last
  mast** (noise cleared, the echoeel sent away, seals and debris reset) instead of losing
  the run. The HUD tracks `CHECKPOINTS n/3`.
- **PREHISTORIC TANK** — a new chase tank where you play a **lungfish** fleeing through
  three thirds of deep time: the **Devonian sea** (swim from a **DUNKLEOSTEUS** while
  dodging **ammonites** that knock you back but **distract** the armored fish when it hits
  one), a **swamp** (run on your fins from a lunging **VELOCIRAPTOR**, diving through water
  pools it won't enter), and the **highlands**, which open on a cutscene of the **TITANOBOA
  coiled in a tree, slowly moving** before the giant snake drops and chases you across land
  and water on a **long, fixed-length body**. Checkpoint masts and a three-part progress bar pace the run.
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
- **Smoother, lighter rendering** — the canvas backing store is capped (device pixel ratio
  1.5 and at most 1920×1080) so large/high-DPI displays stop burning fill-rate; the fixed
  step catch-up is capped at four steps with leftover time dropped to avoid spiral stalls;
  and the shared water gradients plus text font strings are cached instead of rebuilt every
  frame.
- **Tests and docs** — smoke coverage for the mutator screen, rules scaling, records
  persistence, a full five-wave boss-rush clear, and the PlayToy tank (world build, note
  persistence + inventory, head-to-gate matching, wall bounce, exit win, first person); LORE
  gains PLAYTOY EXPLORATION, THE ANCHOR-PACK, LIVING TOYS, THE ANCHOR SWITCH, MUTATORS, BOSS
  RUSH, and RECORDS. The horror-tank/3D/raycast batch also grew checks for first person, raycast overrides, the tanks, and the water pass.
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

### Game systems

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
  MORAY, MINI ZIP EEL, and MINI VOLT EEL matching the tank eels.
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
- **Creature and hazard reworks** — moray eels named and given zip-eel-style faces,
  player-near jaw gapes, a tail-slide entry, and a bite chomp; zip eels reworked into
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
