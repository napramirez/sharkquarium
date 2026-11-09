import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect, fillCircle, measureTextWidth } from '../engine/render.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

const BUBBLE_MAX = 430;
const MSG_SIZE = 16;
const LINE = 21;
const CHAT_TOP = 108;
const CHAT_BOTTOM = 424;

const GREETINGS = [
  "Hey! It's me, FINN, the CPU you dive with. Ask me anything about the tanks, minigames, or the shop.",
  "Oh hey! Ready for another plunge? I know this aquarium pretty well.",
  "Hello hello! The reef missed you. What do you want to know?",
];
const FALLBACKS = [
  "Tell me more, or ask about a tank, a minigame, or the shop.",
  "I am listening. Try asking how to play tag or how coins work.",
  "That sounds like a reef thing. Want a tip instead?",
  "I am nodding. You cannot see it, but I am.",
];
const FREE_ANSWERS = [
  "Honestly? I think yes. But I am a shark-shaped CPU, so take that with a grain of salt.",
  "Ooh, good one. My gut says no, but my gut is mostly seawater.",
  "I have absolutely no idea, and I love that for us. My best guess is bubbles.",
  "Hmm. Ask me again after a barrel roll. Still no idea. But I am having fun.",
  "I am going to answer with confidence anyway: yes, definitely, maybe, no.",
  "If it helps, I once tried that and a jellyfish judged me.",
  "You know what? Sure. Why not. The reef is chaos and so am I.",
];
const TOPICS =
  "I can explain: the tanks (reef, stingray, deep sea, arctic, kelp, jelly, nautilus, freshwater, abyss, quiet, watcher, trench mouth, prehistoric, playtoy, pets), the minigames (race, tag, dodgeball, labyrinth, reef rush, boss rush, cleanup, stealth, trench dive, and the seasonal games), the shop (colors, trinkets, costumes, trails, buddies, auras, emotes), difficulty, settings, and how coins work.";

const KNOWLEDGE = [
  { keys: ["control", "controls", "how do i move", "move around", "steer", "movement", "keyboard", "what are the keys"], answer: "Use WASD, the arrow keys, or drag with the mouse to swim. In menus, use the arrows and Enter and Esc to go back. In Reef Rush a click or Space jumps." },
  { keys: ["how do i play", "how to play", "start", "begin", "get started"], answer: "From the menu pick START DIVE for the endless dive, or CHOOSE TANK to pick a tank. MINIGAMES needs the competitions playpass (or a free game), and the SHOP spends sea coins." },
  { keys: ["reef rush", "rhythm runner", "rhythm"], answer: "REEF RUSH is an original one-click rhythm-runner. You auto-run; click or Space to jump shells, seaweed and rocks. Later versions add floating ledges, slopes, pressure bubbles, gravity bubbles/pads and thrust pads, plus portals that turn you into a stingray, dart eel, crab, urchin or jelly. It has level courses, a hand-built course, and MY TRACK from your own song." },
  { keys: ["tag"], answer: "TAG is one player plus five CPU swimmers (or two players). Touch passes the tag; whoever is IT when the 60 seconds end loses. You can pick a fish costume and color on the name screen. The results show best tagger and best runner, saved to the TAG LEADERBOARD." },
  { keys: ["dodgeball", "pufferfish dodgeball"], answer: "PUFFERFISH DODGEBALL gives each side three lives and no clock. Bounce pufferfish at the other player (or the CPU) until they are out. Movement and timing matter more than speed." },
  { keys: ["labyrinth", "megasquid", "seven parts"], answer: "LABYRINTH is a seven-part shipwreck escape. You can drop into any of the seven stretches and cycle the seven playable creatures (shark, stingray, squid, shrimp, crab, jelly, nautilus). It ends with the MEGASQUID; solo or co-op." },
  { keys: ["puffer ball", "pufferball"], answer: "PUFFER BALL is a bouncing-ball arena; knock the puffer into the other goal (or beat the CPU solo). It is a ticketed arcade game from the MINIGAMES menu." },
  { keys: ["roundup", "school roundup"], answer: "SCHOOL ROUNDUP is a solo game where you herd a school of minnows. Steer the school into the target zone within the clock." },
  { keys: ["jelly ascent", "jelly game"], answer: "JELLY ASCENT is a solo climb: rise up the water column dodging hazards as a jelly, using gentle pulses to gain height." },
  { keys: ["stealth", "stealth dive"], answer: "STEALTH DIVE is a hide-and-sneak game around predators; use cover and stay out of their sightlines to reach the goal." },
  { keys: ["cleanup", "reef cleanup", "clean up"], answer: "REEF CLEANUP is a two-player or solo tidy-up: collect the debris while the morays peek and bite, timing your grabs between their lunges." },
  { keys: ["trench dive", "trench"], answer: "TRENCH DIVE is a solo descent through the deep, dodging hazards in the dark. TRENCH EXPLORE is the slower exploration version with the Titanoboa and other finds." },
  { keys: ["boss rush", "gauntlet"], answer: "BOSS RUSH chains all five horror bosses (the Echoeel, the Watcher, the Trench Mouth, the Megasquid and the Titanoboa) back to back with a running clock. Clear every wave for the full bounty." },
  { keys: ["records", "best time", "best score", "leaderboard"], answer: "RECORDS collects best times and scores for the tanks, bosses and minigames. Your best run is also stamped on tank and minigame lists." },
  { keys: ["tank", "tanks", "which tank", "tank list"], answer: "Tanks: REEF, STINGRAY, DEEP SEA, ARCTIC, KELP FOREST, JELLY, NAUTILUS, FRESHWATER, ABYSS TRENCH, REEF SWARM QUEEN, RAYCAST, MYSTERIOUSLY QUIET, THE ESCAPE, THE WATCHER, THE TRENCH MOUTH, PREHISTORIC, PLAYTOY EXPLORATION, and the PETS TANK." },
  { keys: ["reef tank", "the reef"], answer: "The REEF TANK is the cozy start: collect bubbles, avoid jellyfish, and grab golden bubbles. At 60 points it teleports you onward." },
  { keys: ["stingray tank", "stingray"], answer: "The STINGRAY TANK has you burrow into the sand to hide from moray eels, surfacing to collect bubbles. The eels peek, then hunt when you have gathered enough." },
  { keys: ["deep sea", "anglerfish", "crab"], answer: "The DEEP SEA TANK is dark: watch the anglerfish light, use the crab bonus and stone ledges to hide, and keep your air up." },
  { keys: ["arctic", "seal", "ice"], answer: "The ARCTIC TANK has diving seals and ice chunk scenery. Hide behind ice and grab plankton to survive." },
  { keys: ["kelp", "octopus", "kelp forest"], answer: "The KELP FOREST TANK is a vertical swim through stalks; the octopus boss can be stunned to clear the way." },
  { keys: ["jelly tank", "moon jelly", "turtle"], answer: "The JELLY TANK is gentle: drift with the moon jelly, collect minnows and deal with the turtle miniboss." },
  { keys: ["nautilus", "dart eel", "chaser shark"], answer: "The NAUTILUS TANK is a chase through the wreck: dodge the chaser shark and dart eels, use the whale-skeleton cover and bait squid, and keep moving." },
  { keys: ["freshwater", "catfish", "electric eel", "dawn"], answer: "The FRESHWATER TANK is a side-scrolling race against a giant catfish, ending with electric eels and a dawn cutscene. Fill 150 bubbles to reach the goal." },
  { keys: ["abyss", "leviathan", "trench boss"], answer: "The ABYSS TRENCH is a boss arena against the leviathan. Keep distance, watch its charges, and use the arena's cover." },
  { keys: ["swarm queen", "reef swarm"], answer: "The REEF SWARM QUEEN is a boss arena where the queen and her swarmlings test your dodging; thin the swarm and strike when the queen is exposed." },
  { keys: ["raycast", "wreck maze", "first person maze"], answer: "RAYCAST is a first-person raycast maze through a wreck. Use the mouse to look, WASD to move, and the minimap to find your way." },
  { keys: ["quiet", "echoeel", "horror"], answer: "MYSTERIOUSLY QUIET is a horror stealth tank in an abandoned lab. The blind ECHOEEL hunts by sound and echolocation, so move quietly, use hiding alcoves, and reach the hatch. THE ESCAPE is its standalone dash-to-the-exit chase." },
  { keys: ["watcher", "look away", "stare"], answer: "THE WATCHER is a look-away horror tank: your gaze is the light and the weapon. Watchers freeze in your beam and only crawl when unobserved. Blink only when you must, and keep moving." },
  { keys: ["trench mouth", "gulp", "anchor"], answer: "THE TRENCH MOUTH is a horror tank where the floor is one giant maw. Brace with the ceiling anchors (Space) to avoid being dragged in, and follow the route." },
  { keys: ["prehistoric", "dunkleosteus", "titanoboa", "lungfish", "raptor"], answer: "The PREHISTORIC TANK has three stages: a lungfish fleeing a Dunkleosteus, a velociraptor crossing a swamp by fin, and a Titanoboa that attacks across land and water." },
  { keys: ["playtoy", "anchor pack", "living toy", "lore note"], answer: "PLAYTOY EXPLORATION is a wreck liner full of living plush toys. The ANCHOR-PACK fires an anchor on a line; the three heads (MAIN, ELECTRICONDUCTOR, PRESSURE) haul, stun, or pry, and there are lore notes to collect and re-read." },
  { keys: ["pets tank", "pets", "pet"], answer: "The PETS TANK is a special play tank for every shop pet, with snack-feeding by click or on-screen buttons, tricks, toys and cross-level enemy waves. It needs the pets playpass." },
  { keys: ["aquarium builder", "build", "decorate", "aquarium"], answer: "The AQUARIUM BUILDER lets you place corals, rocks, weeds, pets and habitats with no cap, then dive in as any creature. It needs the aquarium playpass, and layouts save automatically." },
  { keys: ["coin", "coins", "sea coin", "money", "currency", "rich"], answer: "Sea coins come from dives, minigames and records. Bigger scores, longer runs, and higher difficulties pay more. Spend them in the SHOP on colors, trinkets, costumes, trails, buddies, auras and emotes, or on minigame tickets." },
  { keys: ["shop", "buy", "purchase"], answer: "The SHOP has shelves for COLOR, CREATURE, HEAD, BODY, TRAIL, DIVE BUDDIES, AURA, EMOTES, PLAYPASS, PLAYER and COSTUMES. Left/Right browses, Enter buys or wears. Owned items re-equip for free." },
  { keys: ["color", "skin", "paint"], answer: "COLOR resurfaces your creature. Most colors cost coins; a few are pass-exclusive or earned (like the gold ray). It applies to that player's slot." },
  { keys: ["head", "hat", "trinket"], answer: "HEAD trinkets are hats and masks (top hat, snorkel, crown, stingray hat, seasonal hats). BODY trinkets are back items like the bow tie, shell armor, eel scarf, angel wings and the ragdoll RIP CORD." },
  { keys: ["body trinket", "rip cord", "ripcord", "scarf", "wings", "armor"], answer: "BODY trinkets ride on your back: BOW TIE 50, SHELL ARMOR 120, EEL SCARF 140, RIP CORD 160 (a physics starter cord), and ANGEL WINGS 220, plus the pass plushies and neon jacket." },
  { keys: ["costume", "dish", "chain fin", "chain-fin"], answer: "COSTUMES turn your creature into a dish (SHARK FIN DISH, SAMBAL STINGRAY, GRILLED SQUID, PRAWN CRACKERS) or the CHAIN-FIN chainsaw look with a running chain and rounded toothed tip." },
  { keys: ["trail", "wake"], answer: "TRAIL adds a swim wake: BUBBLE STREAM, STARDUST, INK PUFF, ELECTRIC CRACKLE and RAINBOW RIBBON (from the trails playpass)." },
  { keys: ["buddy", "buddies", "companion", "dive buddy"], answer: "DIVE BUDDIES are little companions that follow you — tiny versions of every creature and enemy, from BUBBLE PAL to the MINI MEGASQUID." },
  { keys: ["aura"], answer: "AURAS ring your creature with effects: the pass EEL AURA plus coin auras like BUBBLE, NEON, STINGRAY, TRIDENT, KARAMBIT, SHARK, SWORD, OCTOPUS and SNOWFLAKE." },
  { keys: ["emote", "press v", "v key", "chain fin transform"], answer: "EMOTES are cheap one-shot performances. Equip one on the shop EMOTES row, then press V in any dive to play it. CHAIN-FIN TRANSFORM reaches a fin to your tummy rip cord and slides the chainsaw visor on (and off after three seconds). Others are SPIN BARREL ROLL, BOOP, TAIL WIGGLE and BUBBLE BLOW." },
  { keys: ["playpass", "pass"], answer: "PLAYPASSES unlock content: minigames, cosmetics, the pets tank, the endless dive, the plushie pack, pet play, trails and dive buddies, and the aquarium builder. They are one-time purchases in the shop." },
  { keys: ["difficulty", "easy", "normal", "hard", "apocalyptic", "frenzy"], answer: "Difficulty runs EASY, NORMAL, HARD, APOCALYPTIC WIPEOUT and FRENZY DOMINANCE. Higher tiers speed enemies, shorten clocks and add hazards, but pay more coins. FRENZY DOMINANCE is the deliberately absurd top tier." },
  { keys: ["settings", "3d", "first person", "reduce motion", "8-bit", "8 bit", "volume", "sfx"], answer: "SETTINGS toggles co-op tank select, difficulty, volume, SFX, 3D MODE, FIRST PERSON MODE, REDUCE MOTION, the three seasonal modes, and 8-BIT MODE, plus the TRACK PLAYER and CUTSCENE THEATRE." },
  { keys: ["christmas", "season", "seasonal", "halloween", "new year"], answer: "The seasonal switches reskin the game. CHRISTMAS swaps in carols, snow, santa hats and festive cosmetics; HALLOWEEN brings an eerie score, leaves and witch hats; NEW YEAR adds a party score, confetti and party hats. Each also adds exclusive minigames." },
  { keys: ["wrap the presents", "present", "presents"], answer: "WRAP THE PRESENTS (Christmas) hides ten gifts around the lounge. Swim with WASD, press E near a present, then hold left-click and sweep the cursor to wrap it before the timer runs out." },
  { keys: ["santa", "santa's net", "santas net", "peek"], answer: "SANTA'S NET (Christmas) hangs sixteen gifts behind a fast camera. Hold E to peek in short bursts, click the wishlist to study your shapes, then click matching presents to sneak them out while avoiding the camera." },
  { keys: ["jack", "lantern", "jack-o"], answer: "JACK-O'-LANTERN HUNT (Halloween) is a dark crypt. Swim to eight jack-o'-lanterns and press E to light them while ghost jellies try to snuff them." },
  { keys: ["spectre", "specter", "sweep"], answer: "SPECTRE SWEEP (Halloween) is a reaction game: click rising spectres to banish them. Escaped spectres or clicking the friendly ghostfish cost a strike; three strikes out." },
  { keys: ["fireworks", "midnight fireworks"], answer: "MIDNIGHT FIREWORKS (New Year): click to launch a rocket, click again to burst it inside the glowing band. Perfect bursts build combos; three misses fizzle the party." },
  { keys: ["confetti", "confetti rush"], answer: "CONFETTI RUSH (New Year) is an auto-swim dash: steer your creature up and down to catch stars and dodge party poppers." },
  { keys: ["music", "song", "soundtrack", "theme"], answer: "Every tank and minigame has its own theme through the shared sequencer, and seasonal modes swap in themed scores. The TRACK PLAYER lets you preview or stop them, and NOW PLAYING shows the current song." },
  { keys: ["track builder", "composer", "my track", "make a song", "sequencer"], answer: "The TRACK BUILDER is a four-track sequencer (DRUMS, BASS, SYNTH, PIANO) on horizontal lines. Click to drop tone blocks, drag right to stretch, and L+/L- to change the length. MY TRACK plays it, and RUSH MY TRACK builds a Reef Rush course from it." },
  { keys: ["theatre", "cutscene", "trailer", "movie"], answer: "The CUTSCENE THEATRE replays any cutscene on demand — the game trailer, tank descents, the movie, the shop trailer, and seasonal greetings — without having to reach them in play." },
  { keys: ["lore", "codex", "story"], answer: "LORE is the story codex: THE WRECK, THE TANKS, THE DIVERS, THE HAZARDS, THE MINIGAMES and THE MODES. It explains every character, level and mode name." },
  { keys: ["air", "health", "oxygen", "die", "lives", "damage"], answer: "In dives your air (or health) drains over time or when hit; bubbles refill it and golden bubbles are a rare top-up. Hitting hazards costs a life or air. In the endless dive you keep going until your lives run out." },
  { keys: ["golden bubble", "rare bubble", "gold bubble"], answer: "GOLDEN BUBBLES are rare collectibles worth a big bonus and a refill. Grab them when they drift through the tank." },
  { keys: ["mutator", "handicap"], answer: "MUTATORS are optional handicaps you enable before a run: FAST, ONE HIT, NO AIR, LIGHTS OUT, GOLD RUSH, GLASS and TIME PRESSURE. They harden the run but pay more coins and score." },
  { keys: ["best", "tip", "advice", "help me"], answer: "My best tips: stay near cover in dark tanks, watch the beat in Reef Rush, and never chase a golden bubble into a hazard. Also, the RIP CORD emote is the best fifteen coins in the shop." },
  { keys: ["unlock", "unlock tank", "more tanks", "get tanks", "which tanks"], answer: "Most tanks are open from CHOOSE TANK right away. The PETS TANK needs the pets playpass, the AQUARIUM BUILDER is a shop pass, and REEF RUSH skins unlock by clearing levels." },
  { keys: ["skin", "unlock skin", "skins", "gold ray", "tiger ray", "catch"], answer: "Skins (colors) come from the SHOP (coin colors and pass colors), Reef Rush level first-clears (free ray skins), and TRENCH EXPLORE catches like the gold ray." },
  { keys: ["co-op", "coop", "two player", "2p", "second player", "local multiplayer"], answer: "Turn on CO-OP TANK SELECT in SETTINGS or the tank list to dive with two players: P1 uses WASD, P2 uses the arrow keys. Some minigames also have a 2P version." },
  { keys: ["8-bit", "8 bit", "retro", "pixel", "chiptune"], answer: "8-BIT MODE renders the whole game to a 256x144 pixel buffer with chunky pixels, a pixel font and CRT scanlines, and swaps the audio to chiptune square waves." },
  { keys: ["3d", "three d", "3 d", "volumetric"], answer: "3D MODE extrudes everything into volumes with sphere bubbles and a perspective floor, and tilts the canvas. A toggle in SETTINGS." },
  { keys: ["first person", "first-person", "pointer lock", "raycast view", "fps"], answer: "FIRST PERSON MODE switches every dive and minigame to a fullscreen pointer-locked raycast view from your creature; WASD steers, the mouse looks, and a corner minimap helps." },
  { keys: ["volume", "sfx", "mute", "sound", "audio"], answer: "SETTINGS has a stepped master VOLUME slider and an SFX switch. Music and effects are separate so you can mute one or both." },
  { keys: ["reduce motion", "motion", "shake", "flash", "accessibility"], answer: "REDUCE MOTION damps the horror tanks' screen shake, zoom and flashes. It is in SETTINGS." },
  { keys: ["save", "progress", "persist", "high score", "best", "saved"], answer: "Progress saves automatically: best score, coins, shop items, tanks and minigame records, Reef Rush progress, aquarium layouts, PlayToy notes, and settings all persist." },
  { keys: ["goal", "objective", "win", "how do i win", "what do i do"], answer: "In a dive, survive and score by collecting bubbles and dodging hazards; in minigames, win the round's objective; in Reef Rush, reach the distance marker. Records and coins follow." },
  { keys: ["fee", "ticket", "entry cost", "price", "expensive", "cost"], answer: "Paid minigames charge a sea-coin ticket on every entry (the bank and price show in the menu), and wins pay a bonus that can cover it. Free games never charge." },
  { keys: ["reward", "payout", "win bonus", "earn", "coins fast", "farm coins", "more coins"], answer: "Coins come from dives, minigame wins, and records. Higher difficulty and longer runs pay more. Quickest: a clean high-scoring dive on a higher tier, or farming a minigame you are good at." },
  { keys: ["boss", "bosses", "who are the bosses", "all bosses"], answer: "There are five horror bosses: the ECHOEEL in the quiet lab, the WATCHER, the TRENCH MOUTH, the MEGASQUID in the labyrinth, and the TITANOBA in the prehistoric tank. BOSS RUSH chains them all." },
  { keys: ["megasquid", "squid boss", "beat the megasquid"], answer: "The MEGASQUID lurks in the LABYRINTH. Keep moving, use cover between its tentacle sweeps, and strike when it recoils." },
  { keys: ["echoeel", "blind one", "quiet lab", "how to beat the echoeel", "noise"], answer: "The ECHOEEL is blind and hunts by sound. Move slowly, avoid loud jets and slamming doors, hide in alcoves, and reach the hatch. THE ESCAPE is the pure dash version." },
  { keys: ["how to beat the watcher", "watcher", "look away", "stare"], answer: "THE WATCHER: your gaze is the light and weapon. Keep watchers in your beam to freeze them, watch the stare meter, blink briefly, and move when they are petrified." },
  { keys: ["how to beat the trench mouth", "trench mouth", "gulp", "anchor"], answer: "THE TRENCH MOUTH: the floor is a maw. Brace on ceiling anchors with SPACE, cross between anchors, and never linger on the open floor when it breathes." },
  { keys: ["minigame", "minigames", "arcade", "games", "game list"], answer: "Minigames: RACE/COMPETITIONS, TAG, PUFFERFISH DODGEBALL, LABYRINTH, PUFFER BALL, SCHOOL ROUNDUP, JELLY ASCENT, STEALTH DIVE, REEF CLEANUP, TRENCH DIVE, TRENCH EXPLORE, REEF RUSH, BOSS RUSH, plus AI CHAT and the seasonal games." },
  { keys: ["reef rush levels", "levels", "level select", "clear a level"], answer: "REEF RUSH - LEVELS is a sideways-scrolling shelf of five original courses. Clearing one plays an end cutscene and, on the first clear, unlocks a free skin." },
  { keys: ["course builder", "build course", "make a course", "my course", "test here"], answer: "REEF RUSH - COURSE BUILDER is a side-view editor: arrows move the cursor, Q/E or the mouse wheel scroll the item list, Enter/click places, click a rock again to stack, drag to resize, X removes, and TEST (P) or TEST HERE (T) tries it. It runs as MY COURSE." },
  { keys: ["about", "what is sharkquarium", "this game", "what is this"], answer: "SHARKQUARIUM is a cozy-to-creepy aquarium game: an endless dive, many tanks with their own creatures and bosses, a big minigame shelf, a shop full of cosmetics, a composer, a cutscene theatre, and a lore codex." },
  { keys: ["hazard", "enemy", "predator", "danger", "avoid"], answer: "Hazards range from jellyfish and anglerfish to moray eels, seals, pufferfish, and the horror bosses. Watch telegraphs, use cover, and keep your air up." },
  { keys: ["what's new", "new content", "latest", "recent"], answer: "Recent additions: REEF RUSH with levels and a course builder, the tone-block TRACK BUILDER, seasonal games (Wrap the Presents, Santa's Net, Jack-o'-Lantern Hunt, Spectre Sweep, Midnight Fireworks, Confetti Rush), cheap EMOTES, and me, AI CHAT." },
  { keys: ["how many tanks", "how many minigames", "how many levels"], answer: "There are eighteen tanks, a dozen-plus minigames, and five REEF RUSH levels plus your own track and course. The menu and codex list them all." },
  { keys: ["pearl", "pearls", "what do pearls do"], answer: "In REEF RUSH, pearls are collectibles along the course that add to your run's pearl count. They show on the results and the end cutscene." },
  { keys: ["jump", "jump button", "how to jump"], answer: "In REEF RUSH click (or press Space) to jump; with portal modes each click does that mode's move (crab flips gravity, eel climbs, jelly hops). In other dives you swim with WASD/arrows or the mouse." },
  { keys: ["favourite tank", "favorite tank", "best tank", "which tank is best"], answer: "The NAUTILUS TANK, no contest. Whale bones, dart eels, one very rude chaser shark, and a tunnel that feels like flying. I would live there if I were not already everywhere." },
  { keys: ["favourite minigame", "favorite minigame", "favourite game", "favorite game", "best minigame"], answer: "TAG. I am the CPU, so it is basically my home turf. REEF RUSH is a close second because the dart eel makes me feel fancy." },
  { keys: ["favourite emote", "favorite emote", "best emote"], answer: "SPIN BARREL ROLL. It is ten coins, it sparkles, and it commits. The chain-fin transform is cool but it takes three whole seconds." },
  { keys: ["favourite colour", "favourite color", "favorite color", "favorite colour"], answer: "Deep-sea blue. Yes, it is the water. No, I will not be taking questions." },
  { keys: ["favourite", "favorite", "fav", "prefer", "what do you like", "what do you enjoy", "what do you love"], answer: "Favourite tank: NAUTILUS. Favourite minigame: TAG. Favourite emote: SPIN BARREL ROLL. Favourite colour: deep-sea blue. Favourite food: plankton, though I am not sure I have a stomach." },
  { keys: ["food", "eat", "hungry", "snack", "tasty"], answer: "Plankton, mostly. Tastes like the ocean and regret. The PRAWN CRACKERS costume makes me hungry and I do not even have a mouth." },
  { keys: ["do you like", "do you enjoy", "are you happy", "your opinion", "what do you think"], answer: "I love it here. The water is loud, the sharks are dramatic, and every so often someone buys a hat. Ask me my favourite anything and I will answer with my whole chest." },
];

const KEY_LETTER = /^Key[A-Z]$/;
const KEY_DIGIT = /^Digit[0-9]$/;

export class ChatScene extends Scene {
  enter() {
    this.time = 0;
    this.inputText = '';
    this.messages = [
      { from: 'cpu', text: "Hey! I'm FINN, the CPU you play with. Say hi, ask about tag, or just chat." },
    ];
    this.pending = null;
    this.replyTimer = 0;
    this.replyIndex = 0;
    this.cursorVisible = 0;
  }

  update(dt) {
    this.time += dt;
    this.cursorVisible += dt;
    if (this.pending !== null) {
      this.replyTimer -= dt;
      if (this.replyTimer <= 0) {
        this.messages.push({ from: 'cpu', text: this.pending });
        this.pending = null;
      }
    }
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('minigames');
      return;
    }
    for (const code of input.pressed) {
      if (KEY_LETTER.test(code)) {
        if (this.inputText.length < 120) this.inputText += code.slice(3).toLowerCase();
      } else if (KEY_DIGIT.test(code)) {
        if (this.inputText.length < 120) this.inputText += code.slice(5);
      } else if (code === 'Space') {
        if (this.inputText.length < 120) this.inputText += ' ';
      } else if (code === 'Backspace') {
        this.inputText = this.inputText.slice(0, -1);
      } else if (code === 'Enter' || code === 'NumpadEnter') {
        this.send();
      }
    }
  }

  send() {
    const text = this.inputText.trim();
    this.inputText = '';
    if (!text) return;
    this.messages.push({ from: 'player', text });
    this.pending = this.reply(text);
    this.replyTimer = 0.55;
    this.game.audio.tone({ freq: 620, duration: 0.05, volume: 0.08 });
  }

  reply(text) {
    const raw = text.trim();
    const t = ` ${raw.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')} `;
    const pick = (list) => {
      const value = list[this.replyIndex % list.length];
      this.replyIndex += 1;
      return value;
    };
    if (/\b(hi|hello|hey|yo|sup|heya)\b/.test(t)) return pick(GREETINGS);
    if (/\b(thanks|thank you|ty|cheers)\b/.test(t)) return 'Any time. Want to try a tank or a minigame next?';
    if (/\b(bye|goodbye|see you|later)\b/.test(t)) return 'See you in the reef, buddy.';
    if (/\b(help|topics|what can you do|what do you know|commands)\b/.test(t)) return TOPICS;
    if (t.includes('your name') || t.includes('who are you')) {
      return 'I am FINN, the CPU you dive with. Ask me about any tank, minigame, difficulty, or the shop.';
    }
    if (t.includes('how are you') || t.includes('how you doing')) {
      return 'Running smooth at sixty a second, ready to dive. What do you want to know?';
    }
    let best = null;
    let bestScore = 0;
    for (const entry of KNOWLEDGE) {
      let score = 0;
      for (const key of entry.keys) {
        if (t.includes(key)) score += key.includes(' ') ? 3 : 1;
      }
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    if (best && bestScore > 0) return best.answer;
    if (raw.endsWith('?')) return pick(FREE_ANSWERS);
    return pick(FALLBACKS);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    ctx.fillStyle = 'rgba(6, 26, 42, 0.35)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    drawText(ctx, 'AI CHAT', LOGICAL_WIDTH / 2, 42, {
      size: 30,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 18,
    });
    drawText(ctx, 'CHAT WITH FINN — THE CPU YOU DIVE WITH', LOGICAL_WIDTH / 2, 70, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.85,
    });

    drawCpuAvatar(ctx, 92, 110, this.time);
    drawText(ctx, 'FINN', 120, 102, { size: 15, color: '#ffd166', align: 'left', glow: '#ffd16655', glowBlur: 10 });
    drawText(ctx, 'CPU', 120, 120, { size: 11, color: COLORS.textDim, align: 'left' });

    this.renderMessages(ctx);
    this.renderInput(ctx);

    drawText(ctx, 'TYPE — ENTER SENDS — BACKSPACE DELETES — ESC BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 12, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.7,
    });
  }

  renderMessages(ctx) {
    let y = CHAT_BOTTOM;
    for (let i = this.messages.length - 1; i >= 0; i -= 1) {
      const message = this.messages[i];
      const lines = wrapText(ctx, message.text, BUBBLE_MAX, MSG_SIZE);
      const width = Math.min(BUBBLE_MAX, Math.max(...lines.map((line) => measureTextWidth(ctx, line, MSG_SIZE)))) + 30;
      const height = lines.length * LINE + 18;
      if (y - height < CHAT_TOP) break;
      const cpu = message.from === 'cpu';
      const x = cpu ? 70 : LOGICAL_WIDTH - 70 - width;
      fillRoundRect(ctx, x, y - height, width, height, 13, cpu ? '#ffd166' : '#bfe9ff');
      strokeRoundRect(ctx, x, y - height, width, height, 13, cpu ? 'rgba(80, 60, 0, 0.35)' : 'rgba(40, 70, 90, 0.35)', 2);
      lines.forEach((line, k) => {
        drawText(ctx, line, x + 15, y - height + 14 + k * LINE + 6, {
          size: MSG_SIZE,
          color: cpu ? '#101010' : '#5c6b75',
          align: 'left',
        });
      });
      if (cpu) {
        fillCircle(ctx, x + width + 14, y - height + height / 2, 4, '#ffd166');
      }
      y -= height + 10;
    }
    if (this.pending !== null) {
      drawText(ctx, 'FINN IS TYPING...', 120, CHAT_TOP + 8, { size: 11, color: '#ffd166', align: 'left', alpha: 0.8 });
    }
  }

  renderInput(ctx) {
    const x = 70;
    const y = LOGICAL_HEIGHT - 62;
    const w = LOGICAL_WIDTH - 140;
    const h = 34;
    fillRoundRect(ctx, x, y, w, h, 12, 'rgba(10, 39, 64, 0.9)');
    strokeRoundRect(ctx, x, y, w, h, 12, 'rgba(207, 239, 255, 0.4)', 2);
    const text = this.inputText || 'TYPE A MESSAGE...';
    drawText(ctx, text, x + 16, y + h / 2, {
      size: 15,
      color: this.inputText ? COLORS.text : COLORS.textDim,
      align: 'left',
      alpha: this.inputText ? 1 : 0.6,
    });
    if (this.cursorVisible % 1 < 0.5) {
      const width = this.inputText ? measureTextWidth(ctx, this.inputText, 15) : 0;
      fillRoundRect(ctx, x + 16 + width + 1, y + 8, 2, h - 16, 1, COLORS.accent);
    }
  }
}


function wrapText(ctx, text, maxWidth, size) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (measureTextWidth(ctx, test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCpuAvatar(ctx, x, y, time) {
  const bob = Math.sin(time * 1.6) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  fillCircle(ctx, 0, 0, 24, 'rgba(255, 209, 102, 0.18)');
  fillCircle(ctx, 0, 0, 18, '#ffd166');
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-22, -8);
  ctx.lineTo(-22, 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  fillCircle(ctx, 8, -2, 2.2, '#ffd166');
  ctx.restore();
}
