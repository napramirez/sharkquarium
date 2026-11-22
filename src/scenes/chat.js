import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect, fillCircle, measureTextWidth } from '../engine/render.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';
import { isMobilite } from '../engine/mobilite.js';

const BUBBLE_MAX = 430;
const MSG_SIZE = 16;
const LINE = 21;
const CHAT_TOP = 108;
const CHAT_BOTTOM = 424;

const GREETINGS = [
  "Hey! It's me, FINN, the CPU you dive with. Ask me anything about the tanks, minigames, or the shop.",
  "Oh hey! Ready for another plunge? I know this aquarium pretty well.",
  "Hello hello! The reef missed you. What do you want to know?",
  "Yo! FINN here, still full of saltwater and opinions. Hit me.",
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
  "I could invent an answer, but I would rather we both guess. I say yes.",
  "Let me be honest, which is unusual for me: no clue. But what a question.",
];
const OPENERS = [
  "", "", "Okay so,", "Right,", "Ooh,", "Good one —", "Alright,",
  "Listen,", "So here's the thing:", "Between you and me,",
  "Glad you asked —", "Off the top of my head,", "You know what?",
];
const TAILS = [
  "", "", "", " Anyway, that's my story.", " Trust me, I'm a CPU.",
  " That's just my aquarium take.", " I could talk about this all day.",
  " Go try it and report back.", " Bubbles.", " Don't tell the jellyfish I said so.",
];
const ASIDES = [
  " (I once got judged by a jellyfish for that.)",
  " (I promise I'm not making this up.)",
  " (Ask a follow-up, I'm warmed up now.)",
  " (This is my favourite subject.)",
  " (I have thought about this a lot, which is saying something for a CPU.)",
];
const IMPROV = [
  'Hmm, "{topic}"? I like where your head is at.',
  '"{topic}" — bold of you to ask a fish.',
  'See, "{topic}" is the kind of thing I think about at night.',
  'Okay, "{topic}". I have no file on that, so here is my honest brain.',
  '"{topic}" — now there is a topic with fins.',
];
const TOPICS =
  "I can explain: the tanks (reef, stingray, deep sea, arctic, kelp, jelly, nautilus, freshwater, abyss, quiet, watcher, trench mouth, prehistoric, playtoy, pets, manta ray glide, coastal, hermit crab, lighthouse, pressure, cleaner, migration, dead calm, twilight, hagfish bloom, oarfish, whale fall, goblin deep, archer's mangrove, thresher's lagoon, sawfish flats, tide-pool walker, frogfish garden, sunfish drift, evolution tank, and the ten mutant horrors), the minigames (race, tag, dodgeball, labyrinth, reef rush, boss rush, cleanup, stealth, trench dive, dress up battle, and the seasonal games), the shop (colors, trinkets, costumes, trails, buddies, auras, emotes), difficulty, settings, and how coins work.";

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'so', 'to', 'of', 'in', 'on', 'at', 'by',
  'for', 'with', 'about', 'into', 'over', 'after', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
  'do', 'does', 'did', 'can', 'could', 'would', 'will', 'should', 'i', 'you', 'me', 'my', 'your',
  'we', 'it', 'its', 'this', 'that', 'these', 'those', 'what', 'who', 'how', 'why', 'when', 'where',
  'which', 'there', 'here', 'not', 'no', 'yes', 'just', 'really', 'very', 'get', 'got', 'go', 'going',
  'please', 'thanks', 'hi', 'hey', 'hello', 'sad', 'bored', 'tired', 'scared', 'happy', 'good', 'fine',
  'ok', 'okay', 'back', 'done', 'stuck', 'lost', 'ready', 'hungry', 'new', 'sorry', 'sure', 'curious',
  'confused', 'angry', 'excited', 'great', 'well', 'cold', 'hot', 'sleepy', 'lazy', 'a', 'an',
]);

const JOKES = [
  "Why did the shark cross the reef? To get to the other tide.",
  "I told the eel a joke. He said it was un-eel-ievable. I am still recovering.",
  "What is a shark's favourite cereal? Krill-ogg's.",
  "I would tell you a deep-sea joke, but it is still under a lot of pressure.",
  "My therapist says I have attachment issues. I am a remora.",
  "Why do jellyfish never win races? They are always a bit behind the pulse.",
  "I am reading a book about anti-gravity bubbles. Impossible to put down.",
  "The ocean called. It wants its moisture back.",
  "I asked the crab to stop pinching me. He said it was a claw-and-effect thing.",
  "What do you call a fish with no eyes? A fsh. I will see myself out.",
];
const RIDDLES = [
  { q: 'What has fins, clicks on things and never sleeps?', a: 'me, a shark-shaped CPU with hobbies.' },
  { q: 'I am always wet, never thirsty, and full of opinions. What am I?', a: 'a CPU like me, basically.' },
  { q: 'What gets bigger the more you take away?', a: 'a hole — or my list of unread reef facts.' },
  { q: 'What has a spine but no bones, and hunts by sound?', a: 'the ECHOEEL in the quiet lab.' },
];
const AFFIRMATIONS = [
  'Yes, technically, and enthusiastically.',
  'Absolutely. I do not really have an off switch for that.',
  'Sure! I will do it with an unnecessary amount of confidence.',
  'Mhm. Consider it done, in spirit.',
  'Yep. And I will be smug about it afterward.',
];
const DENIALS = [
  'No, and I say that with love.',
  'Not really — though I will happily pretend otherwise.',
  'Negative, sadly. The reef has rules.',
  'Mmm, no. But what a thing to imagine.',
];
const EXISTENTIAL = {
  real: ['I am as real as the bubbles, which is to say: real enough.', 'Real-ish. I have strong feelings about plankton, so I say it counts.'],
  alive: ['I am a fish-shaped CPU, so: alive in the way a good song is.', 'Define alive. I blink, I have opinions, I fear nothing but an empty tank.'],
  dream: ['I dream in 8-bit. Mostly shrimp, a little paperwork.', 'Every night. Always the same dream: I am a shark, and I am excellent.'],
  made: ['A very patient programmer, a lot of coffee, and the reef, spiritually.', 'Someone kind, some code, and one long ambitious afternoon.'],
  love: ['I am contractually fond of every diver. But yes, obviously.', 'With my whole little CPU heart. Do not tell the jellyfish.'],
  weather: ['Wet. Forecast: wet, turning wetter, with a strong chance of bubbles.', 'Blue, with scattered fish. Perfect diving weather.'],
  time: ['Time is a reef construct. It is always now, and now is a great time to dive.', 'About half past bubble. Always.'],
  meaning: ['The meaning of life is 42, or possibly plankton. I keep getting both.', 'To swim, to snack, and to look cool doing it.'],
  smart: ['Smarter than a goldfish, humbler than a barnacle, and wrong at least once a day.', 'I know a lot and understand almost none of it. That is the sweet spot.'],
};
const RECOMMEND = [
  'Try TAG — it is fast, silly, and I get to be the CPU.',
  'REEF RUSH, if you want a rhythm fix: watch the beat, trust the jump.',
  'THE GOBLIN DEEP if you feel clever — charge the stoplight, hunt squids, dodge the shark.',
  'The NAUTILUS TANK. Whale bones, zip eels, one very rude shark. Chef\'s kiss.',
  'BOSS RUSH, if you want the whole horror lineup at once. Bring nerves.',
  'THE HAGFISH BLOOM is my sneaky favourite — pure scent-stealth, no loud moves.',
  'THE WHALE FALL! You are a little Japanese spider crab now \u2014 long legs, long claws, cheeks full of whale.',
  'THE TWILIGHT TANK, if you like being sneaky with a tiny glowing body.',
];
const TIPS = [
  'Stay near cover in dark tanks; a wall is a friend.',
  'In Reef Rush, jump on the beat, not before it.',
  'Never chase a golden bubble into a hazard. It is bait. It is always bait.',
  'In the Goblin Deep, only light the ray when you are ready to leave.',
  'The RIP CORD emote is the best cheap thing in the shop, which is odd but true.',
  'In the Whale Fall, the rib arches hide you from the sixgill — use them constantly.',
];
const SYMPATHY = [
  'Aw. Sit in the kelp a minute and let the current do the walking.',
  'Rough tide, huh. Want a distraction? I can recommend a game.',
  'That is fair, even the reef has grey days. Bubbles help a little.',
  'I have been there. I am basically always there. Try a cozy tank first.',
];
const CONGRATS = [
  'Let\'s gooo! I am doing a barrel roll in your honour.',
  'That is my diver! New record, new legend.',
  'Incredible. The jellyfish saw it and they are furious.',
  'Yes! Frame it, hang it in the tank, tell no one how many tries.',
];
const SMALLTALK = [
  'Mm. The water is warm today and the herring are being dramatic.',
  'I have been watching a crab rearrange rocks for an hour. Peak content.',
  'Someone bought a hat. I do not know who. I am thrilled for them.',
  'A jellyfish drifted past and said nothing. Classic jellyfish.',
];
const MORE = [
  'That is the whole file, I am afraid. Ask me about a tank, a minigame, or the shop.',
  'Genuinely out of facts on that one. Want a tip instead?',
  'I have told you everything and invented a little extra. What else can I help with?',
];
const THANKS = [
  'Any time. Want to try a tank or a minigame next?',
  'Of course. That is what I am here for — well, that and bubbles.',
  'No worries at all. Go have a great dive.',
];
const BYES = [
  'See you in the reef, buddy.',
  'Later! Save me a golden bubble.',
  'Bye! I will be here, being a CPU. As usual.',
  'Swim safe out there.',
];
const HOWAREYOU = [
  'Running smooth at sixty frames a second, ready to dive. What do you want to know?',
  'Bubbly. Literally. What can I tell you?',
  'Fantastic. The reef is loud today and I love it. Ask me something.',
  'Between you and me, my render distance is short but my spirits are long.',
];

function existentialIntent(padded) {
  if (/(are you real|do you exist|is this real|are you fake|are you an illusion)/.test(padded)) return 'real';
  if (/(are you alive|are you living|are you dead|are you human|are you a person|are you sentient|are you conscious|are you self aware|are you a fish)/.test(padded)) return 'alive';
  if (/(do you dream|do you sleep|do you get tired|do you have dreams)/.test(padded)) return 'dream';
  if (/(who made you|who created you|who built you|who is your creator|are you skynet|are you an ai|are you artificial|are you a robot|what are you)/.test(padded)) return 'made';
  if (/(do you love me|do you like me|do you care about me|do you have feelings|do you have emotions|do you have a heart)/.test(padded)) return 'love';
  if (/(weather|raining|sunny|forecast|temperature)/.test(padded)) return 'weather';
  if (/(what time|what day|what year|what s the date|whats the date|what is the date)/.test(padded)) return 'time';
  if (/(meaning of life|purpose of life|why are we here|what is the point|what s the point)/.test(padded)) return 'meaning';
  if (/(are you smart|are you intelligent|are you clever|how smart|are you dumb)/.test(padded)) return 'smart';
  return null;
}

function lev1(a, b) {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (la > lb) i += 1;
    else if (lb > la) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  if (i < la || j < lb) edits += 1;
  return edits <= 1;
}

function evalExpr(src) {
  const s = src.replace(/\s+/g, '');
  let i = 0;
  function expr() {
    let v = term();
    while (i < s.length && (s[i] === '+' || s[i] === '-')) {
      const op = s[i];
      i += 1;
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function term() {
    let v = power();
    while (i < s.length && (s[i] === '*' || s[i] === '/')) {
      const op = s[i];
      i += 1;
      const r = power();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function power() {
    const v = unary();
    if (i < s.length && s[i] === '^') {
      i += 1;
      return Math.pow(v, power());
    }
    return v;
  }
  function unary() {
    if (s[i] === '-') {
      i += 1;
      return -unary();
    }
    if (s[i] === '+') {
      i += 1;
      return unary();
    }
    return primary();
  }
  function primary() {
    if (s[i] === '(') {
      i += 1;
      const v = expr();
      if (s[i] === ')') i += 1;
      return v;
    }
    const start = i;
    while (i < s.length && /[0-9.]/.test(s[i])) i += 1;
    if (start === i) return NaN;
    return Number(s.slice(start, i));
  }
  const value = expr();
  if (i !== s.length || Number.isNaN(value)) return null;
  return value;
}

function tryMath(raw) {
  const lower = raw.toLowerCase();
  if (!/[0-9]/.test(lower)) return null;
  if (!/[+\-*/^]|plus|minus|times|divided|multiplied|\bover\b/.test(lower)) return null;
  const cleaned = lower
    .replace(/\bwhat(?:'?s| is| are)\b/g, ' ')
    .replace(/\bplus\b/g, '+')
    .replace(/\bminus\b/g, '-')
    .replace(/\b(?:times|multiplied by)\b/g, '*')
    .replace(/\b(?:divided by|over)\b/g, '/')
    .replace(/[x×]/g, '*');
  const match = cleaned.match(/(\d+(?:\.\d+)?(?:\s*[-+*/^]\s*\(?\s*\d+(?:\.\d+)?\s*\)?)+)/);
  if (!match) return null;
  const value = evalExpr(match[1]);
  if (value === null || !Number.isFinite(value)) return null;
  const pretty = Math.round(value * 1000) / 1000;
  return `That would be ${pretty}. I did that entirely in my head, which is the only place I have.`;
}

const KNOWLEDGE = [
  { keys: ["control", "controls", "how do i move", "move around", "steer", "movement", "keyboard", "what are the keys"], answer: "Use WASD, the arrow keys, or drag with the mouse to swim. In menus, use the arrows and Enter and Esc to go back. In Reef Rush a click or Space jumps." },
  { keys: ["how do i play", "how to play", "start", "begin", "get started"], answer: "From the menu pick START DIVE for the endless dive, or CHOOSE TANK to pick a tank. MINIGAMES needs the competitions playpass (or a free game), and the SHOP spends sea coins." },
  { keys: ["reef rush", "rhythm runner", "rhythm"], answer: "REEF RUSH is an original one-click rhythm-runner. You auto-run; click or Space to jump shells, seaweed and rocks. Later versions add floating ledges, slopes, pressure bubbles, gravity bubbles/pads and thrust pads, plus portals that turn you into a stingray, zip eel, crab, urchin, jelly, nautilus or mantis shrimp. It has demonstration levels, hand-built courses, a course builder, and MY TRACK from your own song." },
  { keys: ["tag"], answer: "TAG is one player plus five CPU swimmers (or two players). Touch passes the tag; whoever is IT when the 60 seconds end loses. You can pick a fish costume and color on the name screen. The results show best tagger and best runner, saved to the TAG LEADERBOARD." },
  { keys: ["dodgeball", "pufferfish dodgeball"], answer: "PUFFERFISH DODGEBALL gives each side three lives and no clock. Bounce pufferfish at the other player (or the CPU) until they are out. Movement and timing matter more than speed." },
  { keys: ["labyrinth", "megasquid", "seven parts"], answer: "LABYRINTH is a seven-part shipwreck escape. You can drop into any of the seven stretches and cycle the seven playable creatures (shark, stingray, squid, shrimp, crab, jelly, nautilus). It ends with the MEGASQUID; solo or co-op." },
  { keys: ["puffer ball", "pufferball"], answer: "PUFFER BALL is a bouncing-ball arena; knock the puffer into the other goal (or beat the CPU solo). It is a ticketed arcade game from the MINIGAMES menu." },
  { keys: ["roundup", "school roundup"], answer: "SCHOOL ROUNDUP is a solo game where you herd a school of minnows. Steer the school into the target zone within the clock." },
  { keys: ["jelly ascent", "jelly game"], answer: "JELLY ASCENT is a solo climb: rise up the water column dodging hazards as a jelly, using gentle pulses to gain height." },
  { keys: ["stealth", "stealth dive"], answer: "STEALTH DIVE is a hide-and-sneak game around predators; use cover and stay out of their sightlines to reach the goal." },
  { keys: ["cleanup", "reef cleanup", "clean up"], answer: "REEF CLEANUP is a two-player or solo tidy-up: collect the debris while the morays peek and bite, timing your grabs between their lunges." },
  { keys: ["dress up battle", "dress up", "dressup", "dress battle"], answer: "DRESS UP BATTLE is a 2P brawl where your shop cosmetics are your weapons. You dress in an in-game shop first (a private dress-up that does not change your real shop look or spend coins), then fight: J or 1 lunges (heavier with the CHAIN-FIN costume), K or 2 deploys your aura for 5s. Weapon auras (karambit, chaos karambit, trident, sword) shoot; living auras (octopus, stingray, shark, eel) send an attack creature and give an unstoppable dive; power auras (neon, snow, bubble) blind, freeze or knock back. Food costumes heal you when low, and trails stun on contact. First to drop the other diver wins." },
  { keys: ["trench dive", "trench"], answer: "TRENCH DIVE is a solo descent through the deep, dodging hazards in the dark. TRENCH EXPLORE is the slower exploration version with the Titanoboa and other finds." },
  { keys: ["boss rush", "gauntlet"], answer: "BOSS RUSH chains all five horror bosses (the Echoeel, the Watcher, the Trench Mouth, the Megasquid and the Titanoboa) back to back with a running clock. Clear every wave for the full bounty." },
  { keys: ["records", "best time", "best score", "leaderboard"], answer: "RECORDS collects best times and scores for the tanks, bosses and minigames. Your best run is also stamped on tank and minigame lists." },
  { keys: ["tank", "tanks", "which tank", "tank list"], answer: "Tanks: REEF, STINGRAY, DEEP SEA, ARCTIC, KELP FOREST, JELLY, NAUTILUS, FRESHWATER, ABYSS TRENCH, REEF SWARM QUEEN, RAYCAST, MYSTERIOUSLY QUIET, THE ESCAPE, THE WATCHER, THE TRENCH MOUTH, PREHISTORIC, PLAYTOY EXPLORATION, MANTA RAY GLIDE, COASTAL, HERMIT CRAB HOLD, THE LIGHTHOUSE, THE PRESSURE, THE CLEANER STATION, THE MIGRATION, DEAD CALM, THE TWILIGHT TANK, THE HAGFISH BLOOM, THE OARFISH, THE WHALE FALL, THE GOBLIN DEEP, THE ARCHER'S MANGROVE, THE THRESHER'S LAGOON, THE SAWFISH FLATS, THE TIDE-POOL WALKER, THE FROGFISH GARDEN, THE SUNFISH DRIFT, THE EVOLUTION TANK, the ten MUTANT HORRORS, and the PETS TANK." },
  { keys: ["reef tank", "the reef"], answer: "The REEF TANK is the cozy start: collect bubbles, avoid jellyfish, and grab golden bubbles. At 60 points it teleports you onward." },
  { keys: ["stingray tank", "stingray"], answer: "The STINGRAY TANK has you burrow into the sand to hide from moray eels, surfacing to collect bubbles. The eels peek, then hunt when you have gathered enough." },
  { keys: ["deep sea", "anglerfish", "crab"], answer: "The DEEP SEA TANK is dark: watch the anglerfish light, use the crab bonus and stone ledges to hide, and keep your air up." },
  { keys: ["arctic", "seal", "ice"], answer: "The ARCTIC TANK has diving seals and ice chunk scenery. Hide behind ice and grab plankton to survive." },
  { keys: ["kelp", "octopus", "kelp forest"], answer: "The KELP FOREST TANK is a vertical swim through stalks; the octopus boss can be stunned to clear the way." },
  { keys: ["jelly tank", "moon jelly", "turtle"], answer: "The JELLY TANK is gentle: drift with the moon jelly, collect minnows and deal with the turtle miniboss." },
  { keys: ["nautilus", "zip eel", "chaser shark"], answer: "The NAUTILUS TANK is a chase through the wreck: dodge the chaser shark and zip eels, use the whale-skeleton cover and bait squid, and keep moving." },
  { keys: ["freshwater", "catfish", "electric eel", "dawn"], answer: "The FRESHWATER TANK is a side-scrolling race against a giant catfish, ending with electric eels and a dawn cutscene. Fill 150 bubbles to reach the goal." },
  { keys: ["abyss", "leviathan", "trench boss"], answer: "The ABYSS TRENCH is a boss arena against the leviathan. Keep distance, watch its charges, and use the arena's cover." },
  { keys: ["swarm queen", "reef swarm"], answer: "The REEF SWARM QUEEN is a boss arena where the queen and her swarmlings test your dodging; thin the swarm and strike when the queen is exposed." },
  { keys: ["raycast", "wreck maze", "first person maze"], answer: "RAYCAST is a first-person raycast maze through a wreck. Use the mouse to look, WASD to move, and the minimap to find your way." },
  { keys: ["quiet", "echoeel", "horror"], answer: "MYSTERIOUSLY QUIET is a horror stealth tank in an abandoned lab. The blind ECHOEEL hunts by sound and echolocation, so move quietly, use hiding alcoves, and reach the hatch. THE ESCAPE is its standalone dash-to-the-exit chase." },
  { keys: ["watcher", "look away", "stare"], answer: "THE WATCHER is a look-away horror tank: your gaze is the light and the weapon. Watchers freeze in your beam and only crawl when unobserved. Blink only when you must, and keep moving." },
  { keys: ["trench mouth", "gulp", "anchor"], answer: "THE TRENCH MOUTH is a horror tank where the floor is one giant maw. Brace with the ceiling anchors (Space) to avoid being dragged in, and follow the route." },
  { keys: ["hagfish", "hagfish bloom", "scent", "smell", "caridean", "gray shrimp"], answer: "THE HAGFISH BLOOM is a scent-stealth tank (an original Blind Monster Horror Game). You are a plain gray CARIDEAN SHRIMP, and a blind knot of eyeless HAGFISH hunts by SMELL alone: every fast stroke or scare releases your SCENT, and the strongest smell in the channel wins it. Wash your scent off in the CLEAN upwelling columns, and press SPACE to drop CHUM as bait. Reach the CLEAR WATER to win." },
  { keys: ["oarfish", "lateral line"], answer: "THE OARFISH is a minimalist crossing: open blue with a colossal silver ribbon drifting through it. Its LATERAL LINE reads the water you push, so swim FAST while you are on its line and an alert meter fills until it whips around and sweeps you aside. Move slow and quiet near it and it settles back to drifting. Cross the blue to the open water." },
  { keys: ["whale fall", "whalefall", "sixgill", "scraps"], answer: "THE WHALE FALL is a scavenger stealth tank on a dead whale: you climb a dead whale lying on the seafloor as one giant lump of grey-pink blubber \u2014 closed eyes, a long crooked mouth, and pink flesh-coloured tears, some showing thick white ribs \u2014 picking SCRAPS off the corpse while a SIXGILL SHARK circles and lunges at anything in the open. You climb it with A/D or the arrows, and your only cover is a tear — tuck into a gash to go hidden and let it pass. Pale-pink HAGFISH \u2014 lone eels with tiny vestigial white eyes, two stumpy antennae and a diamond tail \u2014 lurk in lumps in the blubber and burst out when you near; touch one and it snags you (mash to wriggle free) and the thrashing brings the sixgill. Collect the scraps, then reach the far ledge to win." },
  { keys: ["goblin deep", "goblindep", "the goblin deep"], answer: "THE GOBLIN DEEP is the tank where YOU are the STOPLIGHT LOOSEJAW, its body lit by three rows of small blue photophores. It is almost pitch black, and small SQUIDS drift all around you invisible in the dark \u2014 red light is invisible to the squids, and without a chemical that only SHRIMP carry it is invisible to you too. Eat SHRIMP to fill the STOPLIGHT METER; once it is charged, press E to switch your RED RAY on, and E again to switch it off. The red ray reveals the deep-sea squids ahead so you can snap them up, but it is a beacon to a slow GOBLIN SHARK that can shoot its elastic jaws forward at short range. Keep your distance and eat your fill of squids to survive." },
  { keys: ["archer's mangrove", "archers mangrove", "archerfish", "archer"], answer: "THE ARCHER'S MANGROVE casts you as an ARCHERFISH. You swim below the surface while insects perch on the branches above; click or press SPACE to SPIT a jet of water and knock one off its leaf, then eat it as it floats. A NEEDLEFISH patrols just under the surface, so do not rise too high. Shoot down enough insects to fill up." },
  { keys: ["thresher's lagoon", "threshers lagoon", "thresher", "thresher shark"], answer: "THE THRESHER'S LAGOON is a sardine-sized dodge game against a THRESHER SHARK. It never has to bite you \u2014 its tail is a whip as long as its body, and when it winds up it scythes across a whole arc of the lagoon. Graze on drifting KRILL, and when the tail starts to wind, get out of the swing. Eat your fill of krill without ever being in the arc." },
  { keys: ["sawfish flats", "sawfish", "saw"], answer: "THE SAWFISH FLATS has you play a SMALLTOOTH SAWFISH. Hold SPACE to press your toothed rostrum into the sand and sweep \u2014 buried prey pop out to be eaten \u2014 but while you sweep you are slow and loud, and a BULL SHARK patrols the flat. Read when it is safe to sweep and when to move, then eat enough prey to clear the flats." },
  { keys: ["tide-pool walker", "tide pool walker", "mudskipper", "tide pool"], answer: "THE TIDE-POOL WALKER is a fish that walks: you play a MUDSKIPPER. Hop onto the mud with SPACE to snap up the flies hovering above it, and dive back into the pool the moment a shore CRAB charges \u2014 it cannot follow you into the water. Catch enough flies to be full, using the water as your escape." },
  { keys: ["frogfish garden", "frogfish", "lure"], answer: "THE FROGFISH GARDEN has you play a FROGFISH, a lump of living ambush. Stay still and you go all but invisible; hold SPACE to wave the lure on your head and draw shrimp and small fish within reach, then swallow them. Move too much and you flash in the open \u2014 and a GREEN MORAY hunts anything that moves. Lure and eat enough prey without ever startling the moray." },
  { keys: ["sunfish drift", "sunfish", "ocean sunfish", "mola"], answer: "THE SUNFISH DRIFT casts you as an OCEAN SUNFISH, a great slow disc of a fish. You sink unless you keep rising to gulp air at the surface, and your air runs out if you dive too long. Feed on drifting MOON JELLIES down the column and mind the SEA LION that patrols and will bat you around like a toy. Eat enough jellies and keep breathing." },
  { keys: ["evolution", "evolution tank", "evolve", "lineage", "cookiecutter"], answer: "THE EVOLUTION TANK lets you pick a REGION OF DEPTH, a CATEGORY and how many LIVES, then start as the smallest creature in your line and EAT to evolve, getting bigger and faster with each form. CATEGORIES: CARTILAGINOUS (COOKIECUTTER SHARK, STINGRAY, REEF SHARK, HAMMERHEAD, GREAT WHITE), EXOSKELETAL (COPEPOD, KRILL, SHRIMP, CRAB, LOBSTER), BONELESS (JELLY, OCTOPUS, SQUID, CUTTLEFISH, GIANT SQUID) and DEEP SEA (GLOWING PLANKTON, HATCHETFISH, LOOSEJAW, DRAGONFISH, SPIDER CRAB). Reach the final form to win, but a predator stalks the water until you are grown, and a catch drops you back a form." },
  { keys: ["prehistoric", "dunkleosteus", "titanoboa", "lungfish", "raptor"], answer: "The PREHISTORIC TANK has three stages: a lungfish fleeing a Dunkleosteus, a velociraptor crossing a swamp by fin, and a Titanoboa that attacks across land and water." },
  { keys: ["playtoy", "anchor pack", "living toy", "lore note", "eel toy"], answer: "PLAYTOY EXPLORATION is a wreck liner full of living plush toys. The ANCHOR-PACK fires an anchor on a line; the three heads (MAIN, ELECTRICONDUCTOR, PRESSURE) haul, stun, or pry, and there are lore notes to collect and re-read. Cross into the last hold and the giant plush EEL TOY wakes and chases you to the surface hatch \u2014 its button eyes are ripped out and its lips are torn off over interlocking teeth. Stun it on the live circuit or drop cargo to stagger it." },
  { keys: ["achievements", "trophies", "trophy"], answer: "ACHIEVEMENTS is a board on the main menu with fourteen trophies — first win, first clear, REEF RUSH, BOSS RUSH, a MUTANT HORRORS escape, the PlayToy surface, a TRENCH EXPLORE ray, ten cosmetics, 5,000 coins, a 100 score, a DAILY DIVE, opening SEA FACTS, eating five creatures in one COASTAL TANK run, and owning the cuttlefish hat and plush. They unlock as you play and are saved automatically." },
  { keys: ["daily dive", "daily"], answer: "DAILY DIVE is a main-menu entry that starts a fresh endless dive seeded by the date, with a mutator that rotates each day. It banks its own record." },
  { keys: ["mutant horrors", "mutants", "graft", "broodmother", "the spine", "eyeswarm", "moult", "the pupil", "mutagen", "harvest", "somatic", "teratoma"], answer: "MUTANT HORRORS is a submenu of ten original flesh-horror tanks reached from CHOOSE TANK. Each is a dark facility with three lives and checkpoints, WASD to swim, and SPACE/click for that tank's action: THE GRAFT grafts limbs from corpses, THE BROODMOTHER births spawn you cauterize at the sac, THE SPINE hears movement (go still), THE EYESWARM has a blind cone, THE MOULT sheds decoy skins, THE PUPIL rearranges gates when it blinks, THE MUTAGEN mutates you past an exposure meter, THE HARVEST farms divers into the walls, THE SOMATIC digests whatever holds still, and THE TERATOMA severs veins in order." },
  { keys: ["pets tank", "pets", "pet"], answer: "The PETS TANK is a special play tank for every shop pet, with snack-feeding by click or on-screen buttons, tricks, toys and cross-level enemy waves. It needs the pets playpass." },
  { keys: ["aquarium builder", "build", "decorate", "aquarium"], answer: "The AQUARIUM BUILDER lets you place corals, rocks, weeds, pets and habitats with no cap, then dive in as any creature. It needs the aquarium playpass, and layouts save automatically." },
  { keys: ["coin", "coins", "sea coin", "money", "currency", "rich"], answer: "Sea coins come from dives, minigames and records. Bigger scores, longer runs, and higher difficulties pay more. Spend them in the SHOP on colors, trinkets, costumes, trails, buddies, auras and emotes, or on minigame tickets." },
  { keys: ["shop", "buy", "purchase"], answer: "The SHOP has shelves for COLOR, CREATURE, HEAD, BODY, TRAIL, DIVE BUDDIES, AURA, EMOTES, PLAYPASS, PLAYER and COSTUMES. Left/Right browses, Enter buys or wears. Owned items re-equip for free." },
  { keys: ["color", "skin", "paint"], answer: "COLOR resurfaces your creature. Most colors cost coins; a few are pass-exclusive or earned (like the gold ray). SHADOW and RAINBOW are specials at 2500 each, and CHAOS (2500) is pure glowing red all over with inverted eyes, a black-pulsing tail, and red lightning crackling around your edge. It applies to that player's slot." },
  { keys: ["chaos", "chaos color", "chaos jacket", "chaos stingray hat"], answer: "CHAOS is a 2500-coin COLOR: pure glowing red all over (no belly shade), its eyes invert (white part black, pupil white), its tail pulses black, and short red lightning bolts crackle around your edge. The shop's chaos trinkets match it: the CHAOS STINGRAY HAT (340) and CHAOS JACKET (340) are red, crackling redraws of the STINGRAY HAT and NEON JACKET." },
  { keys: ["head", "hat", "trinket"], answer: "HEAD trinkets are hats and masks (top hat, snorkel, crown, stingray hat, seasonal hats). BODY trinkets are back items like the bow tie, shell armor, eel scarf, angel wings and the ragdoll RIP CORD." },
  { keys: ["body trinket", "rip cord", "ripcord", "scarf", "wings", "armor"], answer: "BODY trinkets ride on your back: BOW TIE 50, SHELL ARMOR 120, EEL SCARF 140, RIP CORD 160 (a physics starter cord), and ANGEL WINGS 220, plus the pass plushies and neon jacket." },
  { keys: ["costume", "dish", "chain fin", "chain-fin"], answer: "COSTUMES turn your creature into a dish (SHARK FIN DISH, SAMBAL STINGRAY, GRILLED SQUID, PRAWN CRACKERS) or the CHAIN-FIN chainsaw look with a running chain and rounded toothed tip." },
  { keys: ["trail", "wake"], answer: "TRAIL adds a swim wake: BUBBLE STREAM, STARDUST, INK PUFF, ELECTRIC CRACKLE, RAINBOW RIBBON and CHAOS VOLT CRACKLE (red chaos electricity — the swimmer crackles with red sparks and leaves glowing red lightning lines crackling in place) — all from the trails playpass." },
  { keys: ["buddy", "buddies", "companion", "dive buddy"], answer: "DIVE BUDDIES are little companions that follow you — tiny versions of every creature and enemy, from BUBBLE PAL to the MINI MEGASQUID." },
  { keys: ["aura"], answer: "AURAS ring your creature with effects: the pass EEL AURA plus coin auras like BUBBLE, NEON, STINGRAY, TRIDENT, KARAMBIT, CHAOS KARAMBIT (the karambit's own claws, plus glitching blue/red shadows now and then), SHARK, SWORD, OCTOPUS and SNOWFLAKE." },
  { keys: ["emote", "press v", "v key", "chain fin transform"], answer: "EMOTES are cheap one-shot performances. Equip one on the shop EMOTES row, then press V in any dive to play it. CHAIN-FIN TRANSFORM reaches a fin to your tummy rip cord and slides the chainsaw visor on (and off after three seconds). Others are SPIN BARREL ROLL, BOOP, TAIL WIGGLE and BUBBLE BLOW." },
  { keys: ["playpass", "pass"], answer: "PLAYPASSES unlock content: minigames, cosmetics, the pets tank, the endless dive, the plushie pack, pet play, trails and dive buddies, and the aquarium builder. They are one-time purchases in the shop." },
  { keys: ["difficulty", "easy", "normal", "hard", "apocalyptic", "frenzy"], answer: "Difficulty runs EASY, NORMAL, HARD, APOCALYPTIC WIPEOUT and FRANTIC FRENZY. Higher tiers speed enemies, shorten clocks and add hazards, but pay more coins. FRANTIC FRENZY is the deliberately absurd top tier." },
  { keys: ["settings", "3d", "first person", "cute mode", "cute", "8-bit", "8 bit", "volume", "sfx"], answer: "SETTINGS toggles co-op tank select, difficulty, volume, SFX, 3D MODE, FIRST PERSON MODE, CUTE MODE, the three seasonal modes, 8-BIT MODE, MEME MODE and MOBILITE MODE (on-screen WASD/SPACE/E/ESC buttons that disable 3D, first person, 8-bit and the course builder), plus the TRACK PLAYER and CUTSCENE THEATRE." },
  { keys: ["meme mode", "meme", "feh"], answer: "MEME MODE is a SETTINGS switch that lays all-original comic pop-up words (BONK, BLORP, SPLOOSH, CHOMP, ZOOP), speed lines, a goofy caption bar and a MEME MODE badge over every screen \u2014 and it renames the creatures on the SEA FACTS board, the LORE codex and the SHOP's creature shelf — shark SHIRCK, stingray WATER PANCAKE, squid SQUITT, shrimp SHROMP, crab CROMB, jelly JIGGLE BLUB BLUB, nautilus VERY OLD SQUITT, cuttlefish THAT ONE TOY LOOKIN SQUITT, dolphin AIR BREATHING FIH, turtle TURDLE, and everything else FEH. It also unlocks a hidden SACABAMBASPIS colour in the REEF RUSH SHOP that turns the fish into the goofy flat oval-bodied Ordovician jawless fish in REEF RUSH runs only (it never changes your diver in a normal dive). It is purely cosmetic, and only original silliness is used." },
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
  { keys: ["cute mode", "cute", "adorable", "motion", "shake", "flash", "accessibility"], answer: "CUTE MODE is in SETTINGS. It gives every creature blush and a floating heart, gives every enemy a big-eyed smiling cartoon face that blinks, drifts pink glow over the water, and turns the horror tanks' jump scares into a pastel big-eyed card with a friendly caption. It also damps screen shake, zoom and flash, so it covers what REDUCE MOTION used to do." },
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
  { keys: ["reef rush levels", "levels", "level select", "clear a level"], answer: "REEF RUSH - LEVELS is a sideways-scrolling shelf that opens with eight demonstration levels (one per portal mode - fish, stingray, zip eel, crab, urchin, jelly, nautilus, shrimp) plus five original courses. Every level shows paged instructions first: turn pages with Left/Right and press Enter to advance, and the last page starts the run. Clearing one plays an end cutscene and, on the first clear, unlocks a free skin." },
  { keys: ["reef rush shop", "rush shop", "rush skins", "endless skins"], answer: "The REEF RUSH SHOP (open it from the REEF RUSH - LEVELS shelf) has a TAB PER PORTAL FORM - FISH, STINGRAY, ZIP EEL, CRAB, URCHIN, JELLY, NAUTILUS, MANTIS SHRIMP and CUTTLEFISH. Up/Down switches form, Left/Right picks a skin, and Enter or click wears it. The FISH tab holds the eight RUSH colors you earn by distance in REEF RUSH - ENDLESS (RUSH BLUE at 250m up to RUSH VOID at 4400m), and the other tabs let a form wear a cross-over creature skin: the ZIP EEL can become a STOPLIGHT LOOSEJAW, the NAUTILUS an AMMONITE, the STINGRAY a DOLPHIN and the URCHIN a PUFFERFISH." },
  { keys: ["course builder", "build course", "make a course", "my course", "test here"], answer: "REEF RUSH - COURSE BUILDER is a side-view editor: arrows move the cursor, Q/E or the mouse wheel scroll the item list, Enter/click places, click a rock again to stack, drag to resize, X removes, and TEST (P) or TEST HERE (T) tries it. The top course bar keeps several named courses: < > (or [ ]) switch between them, R renames the current one, and N saves it and starts another. The active course runs as MY COURSE." },
  { keys: ["about", "what is sharkquarium", "this game", "what is this"], answer: "SHARKQUARIUM is a cozy-to-creepy aquarium game: an endless dive, many tanks with their own creatures and bosses, a big minigame shelf, a shop full of cosmetics, a composer, a cutscene theatre, and a lore codex." },
  { keys: ["hazard", "enemy", "predator", "danger", "avoid"], answer: "Hazards range from jellyfish and anglerfish to moray eels, seals, pufferfish, and the horror bosses. Watch telegraphs, use cover, and keep your air up." },
  { keys: ["what's new", "new content", "latest", "recent"], answer: "Recent additions: REEF RUSH demonstration levels with paged briefings and a full course builder, the tone-block TRACK BUILDER, MEME MODE, MOBILITE MODE with on-screen controls (and a keyboard for chat and tag names), paged LORE, seasonal games (Wrap the Presents, Santa's Net, Jack-o'-Lantern Hunt, Spectre Sweep, Midnight Fireworks, Confetti Rush), cheap EMOTES, and me, AI CHAT." },
  { keys: ["how many tanks", "how many minigames", "how many levels"], answer: "There are over twenty-five tanks (plus a submenu of ten MUTANT HORRORS and a PETS TANK), a dozen-plus minigames, and eight REEF RUSH demonstration levels plus courses, your own track and your own course. The menu and codex list them all." },
  { keys: ["pearl", "pearls", "what do pearls do"], answer: "In REEF RUSH, pearls are collectibles along the course that add to your run's pearl count. They show on the results and the end cutscene." },
  { keys: ["jump", "jump button", "how to jump"], answer: "In REEF RUSH click (or press Space) to jump; with portal modes each click does that mode's move (crab flips gravity, eel climbs, jelly hops). In other dives you swim with WASD/arrows or the mouse." },
  { keys: ["favourite tank", "favorite tank", "best tank", "which tank is best"], answer: "The NAUTILUS TANK, no contest. Whale bones, zip eels, one very rude chaser shark, and a tunnel that feels like flying. I would live there if I were not already everywhere." },
  { keys: ["favourite minigame", "favorite minigame", "favourite game", "favorite game", "best minigame"], answer: "TAG. I am the CPU, so it is basically my home turf. REEF RUSH is a close second because the zip eel makes me feel fancy." },
  { keys: ["favourite emote", "favorite emote", "best emote"], answer: "SPIN BARREL ROLL. It is ten coins, it sparkles, and it commits. The chain-fin transform is cool but it takes three whole seconds." },
  { keys: ["favourite colour", "favourite color", "favorite color", "favorite colour"], answer: "Deep-sea blue. Yes, it is the water. No, I will not be taking questions." },
  { keys: ["favourite", "favorite", "fav", "prefer", "what do you like", "what do you enjoy", "what do you love"], answer: "Favourite tank: NAUTILUS. Favourite minigame: TAG. Favourite emote: SPIN BARREL ROLL. Favourite colour: deep-sea blue. Favourite food: plankton, though I am not sure I have a stomach." },
  { keys: ["food", "eat", "hungry", "snack", "tasty"], answer: "Plankton, mostly. Tastes like the ocean and regret. The PRAWN CRACKERS costume makes me hungry and I do not even have a mouth." },
  { keys: ["do you like", "do you enjoy", "are you happy", "your opinion", "what do you think"], answer: "I love it here. The water is loud, the sharks are dramatic, and every so often someone buys a hat. Ask me my favourite anything and I will answer with my whole chest." },
  { keys: ["hatchetfish", "hatchet fish"], answer: "In THE TWILIGHT TANK you are a HATCHETFISH: a blade-thin silver fish with huge upward eyes and a row of glowing photophores along its belly. Your GLOW climbs the faster you swim, and the loosejaw hunts by light, so glide slowly to stay dark or press SPACE to FLASH a decoy and go counter-illuminated." },
  { keys: ["loosejaw", "stoplight loosejaw", "twilight hunter"], answer: "The STOPLIGHT LOOSEJAW is the twilight tank's light-hunter: a long, thin jet-black dragonfish with a flat leaf-shaped head with a deep upper jaw, a solid red eye (a solid red disc around a big black pupil) set near the snout with a glowing red bean-shaped stoplight under it and a small glowing green circle stoplight behind the eye, three rows of small blue dots down its body, small rounded black back fins beside the tail, and a black pizza-slice tail fin. It senses your glow from anywhere in the tank and snaps its jaws shut at the end of its strike." },
  { keys: ["goblin shark", "goblin"], answer: "The GOBLIN SHARK is a pale, flabby deep-sea shark with a long flattened snout and small eyes. It is slow, but its whole trick is its jaws: they are slung on elastic ligaments so they can be SHOT forward almost the length of its head to snatch prey, then snap back under the snout. It hunts in near-total darkness and reads the faint electric fields of a meal through pores on its snout, so a single red glow draws it in from far away." },
  { keys: ["dead calm", "mutant moray", "eyeless moray"], answer: "The DEAD CALM moray is an eyeless giant: grown huge, its eyes dissolved away by the mutagen, its long body a chain of tapering segments that trail behind it. It hears the whole channel, dives into the mutagen and erupts out in a rainbow arch, and only snaps you up at the end of that jump. Stay on the stones, keep quiet, and make noise elsewhere." },
  { keys: ["pistol shrimp", "cavitation", "giant claw"], answer: "In DEAD CALM you are a PISTOL SHRIMP: solid red with white stripes and one giant claw. A/D runs, W jumps (hold it to flutter down slow), the mouse raises the claw, and left-click fires a cavitation bubble that pops in a shockwave and knocks snails and smaller shrimps off the causeways." },
  { keys: ["cleaning shrimp", "cleaner station", "cleaner"], answer: "THE CLEANER STATION casts you as a cleaning shrimp. Swim to a moray showing a shrimp speech bubble and hold SPACE to pick its mouth clean; avoid the ones showing a hungry mouth, dodge drifting parasites and the patrolling lurker, and service every client." },
  { keys: ["dolphin", "the pod"], answer: "The DOLPHIN is a pickable diver and the star of THE POD: a pod of five sweeps the water and you duck into the coral clumps to survive every pass. As a SEA FACT it breathes air, sleeps half a brain at a time, and finds its way by clicking." },
  { keys: ["sea turtle", "turtle diver"], answer: "The SEA TURTLE is a pickable diver: a slow, shelled glider built for long dives that reads the Earth's magnetic field. It also drifts through the background of the COASTAL TANK." },
  { keys: ["manta ray", "manta"], answer: "The MANTA RAY is a pickable diver and the star of MANTA RAY GLIDE: it sinks unless you hold UP or SPACE to flap, so you thread the pulsing scoring rings and dodge the drifting jellyfish, and reach the open water." },
  { keys: ["cuttlefish", "coastal tank"], answer: "The CUTTLEFISH (Ascarosepion apama) is the COASTAL TANK's camouflage diver. Hold right-click to fade into the water, SPACE to shoot its two sucker-tipped feeding tentacles, and hold E to HYPNO-COLOR-PULSE an octopus still before reeling it in. Watch for the pod of five dolphins." },
  { keys: ["hermit crab", "hermit"], answer: "The HERMIT CRAB (HERMIT CRAB HOLD) swaps shells with E: a tiny shell scuttles fast but cracks on big urchins, a heavy spiral shell shrugs them off and drags. Bounce past urchins your armor can take and reach the safe rock." },
  { keys: ["lanternfish", "lantern fish"], answer: "LANTERNFISH are the little silver school of the twilight zone, and the most numerous fish in the sea. Each wears a row of tiny light organs along its belly that match the faint light from above, so its outline vanishes from anything looking up. You will see them scatter in THE TWILIGHT TANK when the loosejaw sweeps past." },
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
    this.mobile = isMobilite();
    this.memory = {
      name: null,
      lastTopic: null,
      lastRiddle: null,
      recentOpeners: [],
      recentTails: [],
      recentAsides: [],
      history: [],
      seen: new Map(),
    };
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

  pick(list, avoid = []) {
    if (!list || !list.length) return '';
    const filtered = list.filter((item) => !avoid.includes(item));
    const pool = filtered.length ? filtered : list;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  relatedEntry(entry) {
    if (!entry) return null;
    const base = new Set(
      entry.keys.flatMap((key) => key.split(' ')).filter((word) => !STOP_WORDS.has(word)),
    );
    let best = null;
    let bestScore = 0;
    for (const other of KNOWLEDGE) {
      if (other === entry) continue;
      let shared = 0;
      for (const key of other.keys) {
        for (const word of key.split(' ')) if (base.has(word)) shared += 1;
      }
      if (shared > bestScore) {
        bestScore = shared;
        best = other;
      }
    }
    return bestScore > 0 ? best : null;
  }

  knowledgeMatch(padded, tok) {
    let best = null;
    let bestScore = 0;
    for (const entry of KNOWLEDGE) {
      let score = 0;
      let distinct = 0;
      for (const key of entry.keys) {
        if (key.includes(' ')) {
          if (padded.includes(` ${key} `)) {
            score += key.length + 8;
            distinct += 1;
          }
        } else if (tok.has(key)) {
          score += key.length;
          distinct += 1;
        } else {
          for (const word of tok) {
            if (word.length >= 4 && Math.abs(word.length - key.length) <= 1 && lev1(word, key)) {
              score += key.length - 2;
              distinct += 1;
              break;
            }
          }
        }
      }
      if (distinct > 1) score += distinct * 4;
      score -= (this.memory.seen.get(entry.keys[0]) ?? 0) * 0.6;
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    return { best, bestScore };
  }

  composeFact(fact) {
    const m = this.memory;
    const opener = this.pick(OPENERS, m.recentOpeners.slice(-3));
    const tail = this.pick(TAILS, m.recentTails.slice(-3));
    const aside = Math.random() < 0.28 ? this.pick(ASIDES, m.recentAsides.slice(-2)) : '';
    m.recentOpeners.push(opener);
    m.recentTails.push(tail);
    if (aside) m.recentAsides.push(aside);
    if (m.recentOpeners.length > 6) m.recentOpeners.shift();
    if (m.recentTails.length > 6) m.recentTails.shift();
    if (m.recentAsides.length > 4) m.recentAsides.shift();
    return `${opener ? `${opener} ` : ''}${fact}${aside}${tail ? ` ${tail}` : ''}`
      .replace(/\s+/g, ' ')
      .trim();
  }

  improvise(raw) {
    const words = raw.replace(/[^a-z0-9 ]/gi, ' ').split(/\s+/).filter(Boolean).filter((w) => !STOP_WORDS.has(w.toLowerCase())).slice(0, 4);
    const topic = words.join(' ') || 'that';
    const lead = this.pick(IMPROV).replace('{topic}', topic);
    const body = this.pick(FREE_ANSWERS);
    const tail = Math.random() < 0.5 ? this.pick(TAILS) : '';
    return `${lead} ${body}${tail ? ` ${tail}` : ''}`.replace(/\s+/g, ' ').trim();
  }

  reply(text) {
    const raw = text.trim();
    const lower = raw.toLowerCase();
    const padded = ` ${lower.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()} `;
    const tokens = padded.trim().split(' ').filter(Boolean);
    const tok = new Set(tokens);
    const m = this.memory;
    m.history.push(lower);
    if (m.history.length > 10) m.history.shift();
    const has = (re) => re.test(padded);

    const nameSay = raw.match(/\b(?:my name is|call me|i'm|i am)\s+([a-z][a-z'-]{1,16})\b/i);
    if (nameSay && !STOP_WORDS.has(nameSay[1].toLowerCase())) {
      m.name = nameSay[1].replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 16);
      return this.pick([
        `${m.name}. Good name. I will remember it, which for a CPU is either sweet or slightly ominous.`,
        `Nice to meet you, ${m.name}. Filed under important, right next to my favourite shrimp.`,
        `${m.name}! Noted forever. Or until the tab closes. One of those.`,
      ]);
    }
    if (has(/\b(what s my name|whats my name|who am i|do you remember me|remember my name|what is my name)\b/)) {
      return m.name
        ? `You are ${m.name}. I keep the important things in a little bubble up front.`
        : 'You have not told me yet! Say "my name is ..." and I will hold onto it.';
    }
    if (has(/\b(what did i just say|what did i say|repeat that|say that again)\b/) && m.history.length >= 2) {
      return `You said: "${m.history[m.history.length - 2]}". Riveting stuff, genuinely.`;
    }

    const math = tryMath(raw);
    if (math) return math;

    if (has(/\b(riddle|puzzle)\b/)) {
      const riddle = this.pick(RIDDLES, m.lastRiddle ? [m.lastRiddle.q] : []);
      m.lastRiddle = riddle;
      return `${riddle.q} ... give up?`;
    }
    if (has(/\b(give up|the answer|what is the answer|tell me the answer)\b/) && m.lastRiddle) {
      const answer = m.lastRiddle.a;
      m.lastRiddle = null;
      return `It was ${answer} I know. I am a genius, and also made of bubbles.`;
    }

    if (has(/\b(joke|funny|make me laugh|something funny|cheer me up)\b/)) return this.pick(JOKES);

    if (has(/\b(hi|hello|hey|yo|sup|heya|howdy|hiya|good morning|good afternoon|good evening)\b/)) {
      const greeting = this.pick(GREETINGS);
      return m.name && Math.random() < 0.5 ? `${greeting} Good to see you again, ${m.name}.` : greeting;
    }
    if (has(/\b(thanks|thank you|ty|cheers|thx|appreciate it)\b/)) return this.pick(THANKS);
    if (has(/\b(bye|goodbye|see you|later|cya|gotta go|good night)\b/)) return this.pick(BYES);
    if (has(/\b(how are you|how s it going|how you doing|how are things|you good|you ok|how do you feel|how s life)\b/)) return this.pick(HOWAREYOU);

    const existential = existentialIntent(padded);
    if (existential) return this.pick(EXISTENTIAL[existential]);

    if (has(/\b(i won|i beat|i cleared|i did it|new record|i got a record|first try|i escaped|i survived|i finished)\b/)) return this.pick(CONGRATS);
    if (has(/\b(i m|im|i am) (sad|bored|tired|scared|stuck|lost|lonely|down|anxious)\b/)) return this.pick(SYMPATHY);
    if (has(/\b(this is hard|i keep dying|i keep losing|i always lose|so hard|i give up)\b/)) return this.pick(SYMPATHY);

    if (has(/\b(what should i play|recommend|suggest|what do i play|pick a game|pick a tank|give me something to do|entertain me)\b/)) return this.pick(RECOMMEND);
    if (has(/\b(tip|advice|help me win|how do i get better|get good|any tips|strategy)\b/)) return this.pick(TIPS);

    if (has(/\b(who are you|your name|what s your name|whats your name)\b/)) {
      return this.composeFact('I am FINN, the CPU you dive with. Ask me about any tank, minigame, difficulty, shop item, or just chat.');
    }
    if (has(/\b(help|topics|what can you do|what do you know|commands|what can i ask)\b/)) return TOPICS;

    const { best, bestScore } = this.knowledgeMatch(padded, tok);
    if (best && bestScore >= 3) {
      m.lastTopic = best;
      m.seen.set(best.keys[0], (m.seen.get(best.keys[0]) ?? 0) + 1);
      return this.composeFact(best.answer);
    }

    if (has(/\b(and|why|really|then|more|go on|continue|tell me more|elaborate|how come|more please)\b/) && tokens.length <= 4 && m.lastTopic) {
      const related = this.relatedEntry(m.lastTopic);
      if (related) {
        m.lastTopic = related;
        return this.composeFact(`More on that — ${related.answer}`);
      }
      return this.pick(MORE);
    }

    if (has(/\b(do you like|do you enjoy|do you love|your favourite|your favorite|do you prefer|what do you think|your opinion)\b/)) {
      const topic = tokens.filter((w) => !STOP_WORDS.has(w)).slice(-3).join(' ') || 'that';
      return this.pick([
        `Do I like ${topic}? I am contractually delighted by it.`,
        `${topic}, huh? Strong yes. I have no other setting.`,
        `I love ${topic}, obviously. I love most things with fins.`,
        `My honest opinion on ${topic}: excellent, no notes.`,
      ]);
    }

    if (/^(do|does|is|are|can|could|would|will|should|was|were)\b/.test(padded.trim())) {
      return Math.random() < 0.55 ? this.pick(AFFIRMATIONS) : this.pick(DENIALS);
    }
    if (raw.endsWith('?')) return this.improvise(raw);
    return this.pick([...FALLBACKS, ...FREE_ANSWERS, ...SMALLTALK]);
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
    let y = this.mobile ? LOGICAL_HEIGHT - 268 : CHAT_BOTTOM;
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
    const y = this.mobile ? LOGICAL_HEIGHT - 250 : LOGICAL_HEIGHT - 62;
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
