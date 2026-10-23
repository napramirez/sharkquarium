import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { TagSwimmer } from '../entities/tagswimmer.js';
import { recordMinigame } from '../engine/progress.js';
import {
  CONTROLS,
  TAG,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  WATER_PALETTE,
} from '../config.js';

const SCALE = LOGICAL_WIDTH / TAG.worldWidth;
const NAME_KEY = /^(Key[A-Z]|Digit[0-9])$/;

export class TagScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.phase = 'names';
    this.activeField = 0;
    this.inputText = params.names ? params.names.slice() : ['', ''];
    this.names = ['P1', 'P2'];
    this.swimmers = [];
    this.taggerIndex = 0;
    this.taggerName = '';
    this.flashTimer = 0;
    this.tagCooldown = 0;
    this.timeLeft = TAG.duration;
    this.resultLoser = '';
    this.winner = false;
    this.reward = 0;
    this.resultsMenu = new SelectList(
      [
        { label: 'PLAY AGAIN', action: 'again' },
        { label: 'MINIGAMES', action: 'minigames' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 46,
        fontSize: 20,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.chooseResult(item.action),
      },
    );
    this.resultsMenu.reset();
  }

  startRound() {
    this.names = this.inputText.map((text, index) =>
      (text.trim() || `P${index + 1}`).toUpperCase().slice(0, TAG.nameMaxLength),
    );
    const pool = TAG.cpuNames.filter((name) => !this.names.includes(name));
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const colors = [...TAG.cpuColors];
    for (let i = colors.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]];
    }
    this.swimmers = [
      new TagSwimmer({
        name: this.names[0],
        color: TAG.p1Color,
        cpu: false,
        controls: CONTROLS.p1,
        x: TAG.worldWidth * 0.35,
        y: TAG.worldHeight * 0.5,
      }),
      new TagSwimmer({
        name: this.names[1],
        color: TAG.p2Color,
        cpu: false,
        controls: CONTROLS.p2,
        x: TAG.worldWidth * 0.65,
        y: TAG.worldHeight * 0.5,
      }),
    ];
    for (let i = 0; i < TAG.cpuCount; i += 1) {
      this.swimmers.push(
        new TagSwimmer({
          name: pool[i] ?? `CPU ${i + 1}`,
          color: colors[i % colors.length],
          cpu: true,
          x: rand(200, TAG.worldWidth - 200),
          y: rand(160, TAG.worldHeight - 160),
        }),
      );
    }
    this.timeLeft = TAG.duration;
    this.winner = false;
    this.reward = 0;
    this.giveTagger(Math.floor(Math.random() * this.swimmers.length));
    this.tagCooldown = TAG.tagCooldown;
    this.phase = 'play';
  }

  giveTagger(index, from = null) {
    this.taggerIndex = index;
    this.swimmers.forEach((swimmer, swimmerIndex) => {
      swimmer.isTagged = swimmerIndex === index;
    });
    const tagger = this.swimmers[index];
    tagger.tags += 1;
    if (tagger.cpu) tagger.pickRandomTarget(this.swimmers);
    if (from !== null && from !== index) {
      const origin = this.swimmers[from];
      let dirX = tagger.x - origin.x;
      let dirY = tagger.y - origin.y;
      let length = Math.hypot(dirX, dirY);
      if (length < 0.01) {
        const angle = rand(0, TAU);
        dirX = Math.cos(angle);
        dirY = Math.sin(angle);
        length = 1;
      }
      tagger.x = clamp(tagger.x + (dirX / length) * TAG.tagGap, tagger.radius, TAG.worldWidth - tagger.radius);
      tagger.y = clamp(tagger.y + (dirY / length) * TAG.tagGap, tagger.radius, TAG.worldHeight - tagger.radius);
      tagger.vx = (dirX / length) * TAG.tagPush;
      tagger.vy = (dirY / length) * TAG.tagPush;
    }
    this.taggerName = tagger.name;
    this.flashTimer = TAG.flashTime;
    this.game.audio.tone({ freq: 240, endFreq: 520, type: 'triangle', duration: 0.22, volume: 0.26 });
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.startRound();
    else this.game.changeScene('minigames');
  }

  updateNames(input) {
    for (const code of input.pressed) {
      if (code === 'Backspace') {
        this.inputText[this.activeField] = this.inputText[this.activeField].slice(0, -1);
      } else if (NAME_KEY.test(code) && this.inputText[this.activeField].length < TAG.nameMaxLength) {
        this.inputText[this.activeField] += code.startsWith('Key') ? code.slice(3) : code.slice(5);
        this.game.audio.tone({ freq: 700, duration: 0.03, volume: 0.06 });
      }
    }
    if (input.wasPressed('confirm')) {
      if (this.activeField === 0) {
        this.activeField = 1;
        this.game.audio.tone({ freq: 560, duration: 0.06, volume: 0.12 });
      } else {
        this.startRound();
      }
    }
  }

  updatePlay(dt, input) {
    const tagger = this.swimmers[this.taggerIndex];
    for (const swimmer of this.swimmers) {
      if (swimmer.cpu) swimmer.updateCpu(dt, this.swimmers, tagger);
      else swimmer.updatePlayer(dt, input);
    }
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    if (this.tagCooldown > 0) {
      this.tagCooldown -= dt;
    } else {
      for (let i = 0; i < this.swimmers.length; i += 1) {
        if (i === this.taggerIndex) continue;
        const other = this.swimmers[i];
        if (Math.hypot(other.x - tagger.x, other.y - tagger.y) < other.radius + tagger.radius) {
          const previous = this.taggerIndex;
          this.tagCooldown = TAG.tagCooldown;
          this.giveTagger(i, previous);
          break;
        }
      }
    }
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.resultLoser = this.swimmers[this.taggerIndex].name;
      this.winner = this.swimmers[this.taggerIndex].cpu;
      this.reward = recordMinigame(this.winner);
      this.phase = 'results';
      this.resultsMenu.reset();
      this.game.audio.tone({ freq: 392, type: 'triangle', duration: 0.24, volume: 0.2 });
      this.game.audio.tone({ freq: 311, type: 'triangle', duration: 0.4, volume: 0.2, delay: 0.2 });
    }
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (this.phase === 'names') {
      if (input.wasPressed('back')) {
        this.game.changeScene('minigames');
        return;
      }
      this.updateNames(input);
      return;
    }
    if (this.phase === 'play') {
      if (input.wasPressed('back')) {
        this.game.changeScene('minigames');
        return;
      }
      this.updatePlay(dt, input);
      return;
    }
    this.resultsMenu.update(dt, input);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    if (this.phase === 'names') this.renderNames(ctx);
    else if (this.phase === 'play') this.renderPlay(ctx);
    else this.renderResults(ctx);
  }

  renderNames(ctx) {
    drawText(ctx, 'TAG', LOGICAL_WIDTH / 2, 96, {
      size: 42,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    drawText(ctx, '2 PLAYERS + 5 CPU SWIMMERS — ENTER YOUR NAMES', LOGICAL_WIDTH / 2, 138, {
      size: 13,
      color: COLORS.foam,
      alpha: 0.8,
    });
    this.renderNameField(ctx, 0, 226, TAG.p1Color, 'P1 NAME');
    this.renderNameField(ctx, 1, 326, TAG.p2Color, 'P2 NAME');
    drawText(
      ctx,
      'TYPE LETTERS AND NUMBERS — BACKSPACE — ENTER TO CONTINUE',
      LOGICAL_WIDTH / 2,
      416,
      {
        size: 12,
        color: COLORS.textDim,
      },
    );
    drawText(ctx, 'ESC — BACK TO MINIGAMES', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 26, {
      size: 12,
      color: COLORS.textDim,
    });
  }

  renderNameField(ctx, index, y, color, label) {
    const active = this.activeField === index;
    drawText(ctx, label, LOGICAL_WIDTH / 2, y - 36, {
      size: 12,
      color,
      alpha: 0.9,
    });
    fillRoundRect(ctx, 280, y - 24, 400, 48, 14, 'rgba(10, 39, 64, 0.85)');
    strokeRoundRect(
      ctx,
      280,
      y - 24,
      400,
      48,
      14,
      active ? COLORS.accent : 'rgba(207, 239, 255, 0.3)',
      active ? 2.5 : 1.5,
    );
    const text = this.inputText[index];
    if (text) {
      drawText(ctx, text, 298, y, {
        size: 22,
        color: COLORS.text,
        align: 'left',
      });
    } else if (!active) {
      drawText(ctx, index === 0 ? 'P1' : 'P2', 298, y, {
        size: 22,
        color: COLORS.textDim,
        alpha: 0.45,
        align: 'left',
      });
    }
    if (active && Math.sin(this.time * 7) > 0) {
      fillRoundRect(ctx, 298 + text.length * 13, y - 12, 3, 24, 1.5, COLORS.accent);
    }
  }

  renderPlay(ctx) {
    ctx.save();
    ctx.scale(SCALE, SCALE);
    strokeRoundRect(
      ctx,
      8,
      8,
      TAG.worldWidth - 16,
      TAG.worldHeight - 16,
      48,
      'rgba(207, 239, 255, 0.28)',
      8,
    );
    for (const swimmer of this.swimmers) swimmer.render(ctx, this.time);
    ctx.restore();

    for (const swimmer of this.swimmers) {
      drawText(ctx, swimmer.name, swimmer.x * SCALE, swimmer.y * SCALE - 32, {
        size: 11,
        color: swimmer.isTagged ? COLORS.danger : COLORS.foam,
        alpha: swimmer.isTagged ? 0.95 : 0.75,
      });
    }

    const ratio = Math.max(0, this.timeLeft / TAG.duration);
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 150, 18, 300, 12, 6, 'rgba(4, 16, 29, 0.6)');
    if (ratio > 0.01) {
      fillRoundRect(
        ctx,
        LOGICAL_WIDTH / 2 - 150,
        18,
        Math.max(12, 300 * ratio),
        12,
        6,
        ratio < 0.2 ? COLORS.danger : COLORS.accent,
      );
    }
    drawText(ctx, `TAG — ${Math.max(0, Math.ceil(this.timeLeft))}s`, LOGICAL_WIDTH / 2, 48, {
      size: 13,
      color: COLORS.textDim,
    });
    drawText(ctx, `IT: ${this.taggerName}`, 24, 40, {
      size: 18,
      color: COLORS.danger,
      align: 'left',
      alpha: 0.7 + 0.3 * Math.sin(this.time * 8),
      glow: COLORS.danger,
      glowBlur: 12,
    });
    drawText(ctx, `P1 ${this.names[0]}`, 24, LOGICAL_HEIGHT - 44, {
      size: 12,
      color: TAG.p1Color,
      align: 'left',
    });
    drawText(ctx, `P2 ${this.names[1]}`, 24, LOGICAL_HEIGHT - 28, {
      size: 12,
      color: TAG.p2Color,
      align: 'left',
    });
    drawText(
      ctx,
      'P1 — WASD      P2 — ARROWS      TOUCH ANOTHER SWIMMER TO PASS THE TAG',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 22,
      {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.75,
      },
    );

    if (this.flashTimer > 0) {
      const alpha = Math.min(1, this.flashTimer / 0.35) * (0.65 + 0.35 * Math.sin(this.time * 16));
      drawText(ctx, `${this.taggerName} IS IT!`, LOGICAL_WIDTH / 2, 230, {
        size: 46,
        color: COLORS.danger,
        glow: COLORS.danger,
        glowBlur: 26,
        alpha,
      });
    }
  }

  renderResults(ctx) {
    fillRoundRect(ctx, 250, 60, 460, 420, 26, 'rgba(10, 39, 64, 0.94)');
    strokeRoundRect(ctx, 250, 60, 460, 420, 26, 'rgba(207, 239, 255, 0.3)', 2);
    drawText(ctx, "TIME'S UP", LOGICAL_WIDTH / 2, 108, {
      size: 34,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.5)',
      glowBlur: 18,
    });
    drawText(ctx, `${this.resultLoser} WAS IT!`, LOGICAL_WIDTH / 2, 150, {
      size: 20,
      color: COLORS.danger,
      alpha: 0.7 + 0.3 * Math.sin(this.time * 7),
    });
    this.swimmers.forEach((swimmer, index) => {
      drawText(
        ctx,
        `${swimmer.name} — ${swimmer.tags} ${swimmer.tags === 1 ? 'TAG' : 'TAGS'}`,
        LOGICAL_WIDTH / 2,
        196 + index * 24,
        {
          size: 13,
          color: swimmer.isTagged ? COLORS.danger : swimmer.color,
          alpha: swimmer.isTagged ? 0.95 : 0.8,
        },
      );
    });
    drawText(
      ctx,
      this.winner
        ? 'A CPU WAS STILL IT — WIN BONUS EARNED'
        : 'A PLAYER WAS STILL IT — NO WIN BONUS',
      LOGICAL_WIDTH / 2,
      380,
      {
        size: 11,
        color: COLORS.textDim,
        alpha: 0.75,
      },
    );
    drawText(ctx, `+${this.reward} SEA COINS`, LOGICAL_WIDTH / 2, 400, {
      size: 12,
      color: COLORS.accent,
      alpha: 0.9,
    });
    this.resultsMenu.render(ctx, LOGICAL_WIDTH / 2, 446);
  }
}
