import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { FONT, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

const BUBBLE_MAX = 430;
const MSG_SIZE = 16;
const LINE = 21;
const CHAT_TOP = 108;
const CHAT_BOTTOM = 424;

const GREETINGS = [
  "Hey! It's me — FINN, the CPU you dive with.",
  'Oh hey! Ready for another plunge?',
  'Hello hello! The reef missed you.',
];
const SMALL_TALK = [
  'Running smooth at sixty frames a second. You?',
  'Same tank, same fins. I like it here.',
  'I have been practising my barrel rolls.',
];
const SHARK_TALK = [
  'Sharks are the best. I may be biased — I AM the CPU.',
  'My favourite trick is a lazy barrel roll through the kelp.',
  'Ever raced a shark? I have. I lost. Twice.',
];
const TAG_TALK = [
  "Tag is my favourite. You will never catch me.",
  'I tag with my eyes closed. Kidding. Mostly.',
  'Pro tip: hold the edge of the arena and let them come to you.',
];
const RUSH_TALK = [
  'Reef Rush? Easy — just don\'t blink on the rock stacks.',
  'I always choke on the dart eel portals. Do not tell anyone.',
  'My best MY TRACK run was one loop and a lot of panicking.',
];
const SPOOKY_TALK = [
  'The quiet lab still gives me the creeps. I do not go there alone.',
  'If the Watcher is watching, look away. That is the whole trick.',
  'The Trench Mouth is just hungry. Relatable.',
];
const SHOP_TALK = [
  'Save your coins for the rip cord emote. It is worth it.',
  'I wear the neon jacket. It makes me faster. Probably.',
  'Collect pearls, bank coins, buy hats. The tank way.',
];
const QUESTIONS = [
  'Good question. I think... yes? Probably?',
  'I do not know, but I am 99% water, so I am unbiased.',
  'Ask me about tag, Reef Rush, or the spooky tanks.',
];
const FALLBACKS = [
  'Totally. Tell me more.',
  'Huh. Neat. What else?',
  'I am nodding. You cannot see it, but I am.',
  'That sounds like a reef thing.',
  'Agreed. Want to race to the coral?',
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
    const t = text.toLowerCase();
    const next = (list) => {
      const value = list[this.replyIndex % list.length];
      this.replyIndex += 1;
      return value;
    };
    if (/\b(hi|hello|hey|yo|sup)\b/.test(t)) return next(GREETINGS);
    if (t.includes('how are you') || t.includes('how you')) return next(SMALL_TALK);
    if (t.includes('your name') || t.includes('who are you')) return 'I am FINN, the CPU. Your built-in dive buddy.';
    if (t.includes('tag')) return next(TAG_TALK);
    if (t.includes('rush') || t.includes('my track') || t.includes('course')) return next(RUSH_TALK);
    if (t.includes('quiet') || t.includes('scary') || t.includes('watcher') || t.includes('trench')) return next(SPOOKY_TALK);
    if (t.includes('coin') || t.includes('shop') || t.includes('buy') || t.includes('emote')) return next(SHOP_TALK);
    if (t.includes('shark') || t.includes('fish') || t.includes('reef') || t.includes('dive')) return next(SHARK_TALK);
    if (t.includes('bye') || t.includes('goodbye')) return 'See you in the reef!';
    if (t.endsWith('?')) return next(QUESTIONS);
    return next(FALLBACKS);
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
      const width = Math.min(BUBBLE_MAX, Math.max(...lines.map((line) => measure(ctx, line, MSG_SIZE)))) + 30;
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
      const width = this.inputText ? measure(ctx, this.inputText, 15) : 0;
      fillRoundRect(ctx, x + 18 + width, y + 8, 2, h - 16, 1, COLORS.accent);
    }
  }
}

function measure(ctx, text, size) {
  ctx.save();
  ctx.font = `700 ${size}px ${FONT}`;
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}

function wrapText(ctx, text, maxWidth, size) {
  ctx.save();
  ctx.font = `700 ${size}px ${FONT}`;
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  ctx.restore();
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
