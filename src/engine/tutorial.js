import { loadJSON, saveJSON } from './storage.js';
import { drawText, fillRoundRect, strokeRoundRect } from './render.js';
import { COLORS } from '../config.js';

const TUTORIAL_KEY = 'sharkquarium.tutorial';
const CARD_W = 560;
const CARD_MS = 8;

const HINTS = {
  'tank:reef': ['REEF TANK', 'COLLECT BUBBLES TO SCORE, DODGE THE JELLYFISH. 60 POINTS TELEPORTS YOU ON.'],
  'tank:stingray': ['STINGRAY TANK', 'BURROW INTO THE SAND TO HIDE FROM THE MORAYS, SURFACE TO COLLECT.'],
  'tank:deepsea': ['DEEP SEA TANK', 'DARK WATER \u2014 USE THE ANGLER LIGHTS, THE CRAB AND THE STONE LEDGES TO HIDE.'],
  'tank:arctic': ['ARCTIC TANK', 'HIDE BEHIND ICE CHUNKS AND EAT PLANKTON WHILE THE SEALS DIVE.'],
  'tank:kelp': ['KELP FOREST TANK', 'SWIM UP THROUGH THE STALKS AND STUN THE OCTOPUS TO CLEAR THE WAY.'],
  'tank:jelly': ['JELLY TANK', 'COLLECT MINNOWS WITH THE MOON JELLY AND DEAL WITH THE TURTLE.'],
  'tank:nautilus': ['NAUTILUS TANK', 'DODGE THE CHASER SHARK AND ZIP EELS, USE THE BONES AS COVER.'],
  'tank:freshwater': ['FRESHWATER TANK', 'OUTRUN THE CATFISH AND FILL 150 BUBBLES TO REACH THE GOAL.'],
  'tank:pets': ['PETS TANK', 'CLICK OR TAP A PET TO FEED IT; KEEP THEM HAPPY THROUGH THE ENEMY WAVES.'],
  cuttlefish: ['THE COASTAL TANK', 'HOLD RIGHT-CLICK TO CAMOUFLAGE, SPACE TO SHOOT FEEDING TENTACLES, E TO STUN.'],
  hermitcrab: ['HERMIT CRAB HOLD', 'PRESS E TO SWAP SHELLS \u2014 LIGHT SHELLS ARE FAST, HEAVY ONES TANK URCHINS.'],
  manta: ['MANTA RAY GLIDE', 'HOLD UP OR SPACE TO FLAP; YOU SINK OTHERWISE. THREAD THE RINGS.'],
  twilight: ['THE TWILIGHT TANK', 'SWIM SLOWLY TO STAY DARK; SPACE FLASHES A DECOY TO MASK YOUR GLOW.'],
  goblindep: ['THE GOBLIN DEEP', 'EAT SHRIMP TO CHARGE THE METER, PRESS E FOR THE RED RAY THAT REVEALS SQUIDS.'],
  hagfish: ['THE HAGFISH BLOOM', 'MOVE SLOWLY TO KEEP YOUR SCENT LOW; SPACE DROPS CHUM AS BAIT.'],
  oarfish: ['THE OARFISH', 'SWIM SLOWLY NEAR THE RIBBON \u2014 FAST STROKES ON ITS LINE ANGER IT.'],
  whalefall: ['THE WHALE FALL', 'CLIMB WITH A/D; TUCK INTO A GASH TO HIDE WHEN THE SIXGILL SWEEPS BY.'],
  archer: ['THE ARCHER\u2019S MANGROVE', 'CLICK OR SPACE TO SPIT WATER AT INSECTS \u2014 STAY BELOW THE NEEDLEFISH.'],
  thresher: ['THE THRESHER\u2019S LAGOON', 'EAT KRILL, AND WHEN THE TAIL WINDS UP, GET OUT OF THE SWING.'],
  sawfish: ['THE SAWFISH FLATS', 'HOLD SPACE TO SWEEP THE ROSTRUM THROUGH THE SAND, BUT NOT WHILE THE BULL SHARK NEARS.'],
  mudskipper: ['THE TIDE-POOL WALKER', 'HOP ONTO THE MUD WITH SPACE TO CATCH FLIES, AND DIVE BACK WHEN A CRAB CHARGES.'],
  frogfish: ['THE FROGFISH GARDEN', 'STAY STILL TO CAMOUFLAGE; HOLD SPACE TO WAVE THE LURE. BEWARE THE MORAY.'],
  sunfish: ['THE SUNFISH DRIFT', 'GULP AIR AT THE SURFACE TO STAY FULL, AND GRAZE MOON JELLIES AS YOU SINK.'],
  swallower: ['THE BLACK SWALLOWER', 'DODGE ITS STRAIGHT LUNGE AND STEER IT THROUGH SCHOOLS OF FISH AND SQUID.'],
  evolution: ['THE EVOLUTION TANK', 'EAT TO EVOLVE INTO BIGGER, FASTER FORMS \u2014 A PREDATOR STALKS YOU UNTIL YOU GROW.'],
  tag: ['TAG', 'TOUCH PASSES THE TAG. WHOEVER IS IT AT THE END LOSES.'],
  dodgeball: ['PUFFERFISH DODGEBALL', 'BOUNCE THE PUFFER AT THE OTHER SIDE UNTIL THEY RUN OUT OF LIVES.'],
  labyrinth: ['LABYRINTH', 'CYCLE THE SEVEN CREATURES AND ESCAPE THE WRECK BEFORE THE MEGASQUID.'],
  reeffrush: ['REEF RUSH', 'CLICK OR SPACE TO JUMP ON THE BEAT; EACH PORTAL MODE MOVES DIFFERENTLY.'],
  pufferball: ['PUFFER BALL', 'KNOCK THE PUFFER INTO THE OTHER GOAL.'],
  roundup: ['SCHOOL ROUNDUP', 'STEER THE SCHOOL OF MINNOWS INTO THE TARGET ZONE.'],
  jellyascent: ['JELLY ASCENT', 'TAP PULSES TO RISE AND THREAD THE RINGS ON THE WAY UP.'],
  stealth: ['STEALTH DIVE', 'STAY OUT OF SIGHTLINES AND USE COVER TO REACH THE GOAL.'],
  cleanup: ['REEF CLEANUP', 'GRAB THE DEBRIS BETWEEN THE MORAYS\u2019 LUNGES.'],
  trench: ['TRENCH DIVE', 'DESCEND THROUGH THE DARK AND DODGE THE HAZARDS.'],
  bossrush: ['BOSS RUSH', 'FIVE HORROR BOSSES BACK TO BACK. CLEAR EVERY WAVE.'],
};

let current = null;
let seenCache = null;

function seen() {
  if (!seenCache) seenCache = loadJSON(TUTORIAL_KEY, {});
  return seenCache;
}

export function hasSeenHint(key) {
  return Boolean(seen()[key]);
}

export function showTutorial(key) {
  if (!HINTS[key] || hasSeenHint(key)) return;
  current = { key, timer: CARD_MS };
}

export function tutorialActive() {
  return current !== null;
}

export function updateTutorial(dt, input) {
  if (!current) return;
  current.timer -= dt;
  const confirm = input.wasPressed('confirm');
  const back = input.wasPressed('back');
  const moved =
    input.wasPressed('up') || input.wasPressed('down') || input.wasPressed('left') || input.wasPressed('right');
  if (!confirm && !back && !moved && current.timer > 0) return;
  seen()[current.key] = true;
  saveJSON(TUTORIAL_KEY, seen());
  current = null;
}

export function renderTutorial(ctx, width) {
  if (!current) return;
  const lines = HINTS[current.key];
  if (!lines) return;
  const height = 26 + lines.length * 20 + 20;
  const x = width / 2 - CARD_W / 2;
  const y = 58;
  const fade = Math.min(1, current.timer / 0.6);
  ctx.save();
  ctx.globalAlpha = 0.92 * fade;
  fillRoundRect(ctx, x, y, CARD_W, height, 14, 'rgba(8, 30, 48, 0.94)');
  strokeRoundRect(ctx, x, y, CARD_W, height, 14, 'rgba(255, 209, 102, 0.7)', 2);
  drawText(ctx, lines[0], width / 2, y + 20, { size: 16, color: COLORS.accent });
  for (let i = 1; i < lines.length; i += 1) {
    drawText(ctx, lines[i], width / 2, y + 22 + i * 20 + 8, {
      size: 12,
      color: COLORS.text,
    });
  }
  drawText(ctx, 'MOVE OR PRESS ENTER TO DISMISS', width / 2, y + height - 12, {
    size: 10,
    color: COLORS.textDim,
    alpha: 0.8 * fade,
  });
  ctx.restore();
}
