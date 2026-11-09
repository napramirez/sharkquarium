import { drawText } from './render.js';
import { TAU } from './math.js';

let meme = false;

export function setMeme(on) {
  meme = Boolean(on);
}

export function isMeme() {
  return meme;
}

const WORDS = [
  'BONK', 'BLORP', 'SPLOOSH', 'CHOMP', 'ZOOP', 'GLUB',
  'WHEE', 'NICE', 'OOPS', 'WHOA', 'SHEESH', 'GULP', 'SPLASH', 'BWOMP',
];

const CAPTIONS = [
  'CERTIFIED REEF MOMENT',
  'THE TANK IS DOING ITS BEST',
  'NO THOUGHTS, JUST BUBBLES',
  'SHARK.EXE IS VIBING',
  'ABSOLUTELY WET BEHAVIOUR',
  'FISH SAID NO',
  'LOW TIDE ENERGY',
  'THE OCEAN DECIDED',
  'THIS IS FINE',
  'BLOOP.',
  'SIR, THIS IS A KELP FOREST',
  'EMOTIONAL SUPPORT FISH',
];

const SLOT = 1.7;

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function drawMemeOverlay(ctx, time, width, height) {
  if (!meme) return;
  const slot = Math.floor(time / SLOT);
  const local = (time / SLOT) % 1;
  const word = WORDS[slot % WORDS.length];
  const cx = 150 + hash(slot * 3.1 + 1) * (width - 300);
  const cy = 120 + hash(slot * 7.7 + 2) * (height * 0.5);
  const pop = Math.max(0.05, Math.min(1, Math.min(local / 0.18, (1 - local) / 0.18)));
  const scale = 0.55 + pop * 0.55;
  const rot = (hash(slot * 5.3) - 0.5) * 0.5;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * TAU + slot * 0.6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 62, Math.sin(a) * 62);
    ctx.lineTo(Math.cos(a) * 112, Math.sin(a) * 112);
    ctx.stroke();
  }
  drawText(ctx, word, 4, 5, { size: 54, weight: 900, color: 'rgba(0, 0, 0, 0.6)' });
  drawText(ctx, word, 0, 0, { size: 54, weight: 900, color: '#ffd166', glow: '#ff6b9d', glowBlur: 18 });
  ctx.restore();

  const caption = CAPTIONS[slot % CAPTIONS.length];
  ctx.save();
  ctx.fillStyle = 'rgba(4, 10, 18, 0.62)';
  ctx.fillRect(0, height - 46, width, 34);
  drawText(ctx, caption, width / 2, height - 29, { size: 16, weight: 900, color: '#cfefff' });
  drawText(ctx, 'MEME MODE', 72, 26, {
    size: 12,
    weight: 900,
    color: '#ffd166',
    glow: 'rgba(255, 209, 102, 0.5)',
    glowBlur: 8,
  });
  ctx.restore();
}
