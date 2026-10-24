import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillRoundRect } from '../engine/render.js';
import { TRACK_LIBRARY } from '../assets/tracks.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

export class TrackPlayerScene extends Scene {
  enter() {
    this.time = 0;
    this.menu = new SelectList(
      [
        ...TRACK_LIBRARY.map((entry) => ({ label: entry.label, action: 'track', entry })),
        { label: 'BACK', action: 'back' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 33,
        height: 30,
        fontSize: 18,
        width: 520,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.choose(item),
      },
    );
    this.menu.reset();
  }

  playingEntry() {
    const track = this.game.music ? this.game.music.track : null;
    if (!track) return null;
    return TRACK_LIBRARY.find((entry) => entry.track === track) ?? null;
  }

  choose(item) {
    if (item.action === 'back') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('settings');
      return;
    }
    const playing = this.playingEntry();
    if (playing && playing === item.entry) {
      this.game.music.stop();
      this.game.audio.tone({ freq: 420, endFreq: 220, duration: 0.12, volume: 0.18 });
      return;
    }
    this.game.music.play(item.entry.track);
    this.game.music.hold = true;
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('settings');
      return;
    }
    if (input.wasPressed('left')) this.menu.move(-1);
    if (input.wasPressed('right')) this.menu.move(1);
    this.menu.update(dt, input);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'TRACK PLAYER', LOGICAL_WIDTH / 2, 54, {
      size: 32,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    drawText(ctx, 'PLAY ANY THEME FROM ANY TANK', LOGICAL_WIDTH / 2, 84, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.8,
    });

    const selected = this.menu.selected;
    if (selected && selected.entry) {
      drawText(ctx, selected.entry.blurb, LOGICAL_WIDTH / 2, 106, {
        size: 12,
        color: COLORS.accent,
        alpha: 0.9,
      });
    }

    this.menu.render(ctx, LOGICAL_WIDTH / 2, 310);
    this.renderNowPlaying(ctx);
    drawText(ctx, 'ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 22, {
      size: 12,
      color: COLORS.textDim,
    });
  }

  renderNowPlaying(ctx) {
    const playing = this.playingEntry();
    if (!playing) {
      drawText(ctx, 'ENTER — PLAY / STOP      UP/DOWN OR LEFT/RIGHT — SELECT', LOGICAL_WIDTH / 2, 130, {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.8,
      });
      return;
    }
    const startX = 268;
    for (let i = 0; i < 7; i += 1) {
      const height = 6 + (Math.sin(this.time * 7 + i * 0.9) + 1) * 7;
      fillRoundRect(ctx, startX + i * 11, 141 - height, 7, height, 2, COLORS.accent);
    }
    drawText(ctx, `NOW PLAYING — ${playing.label}`, startX + 94, 134, {
      size: 12,
      color: COLORS.text,
      align: 'left',
    });
  }
}
