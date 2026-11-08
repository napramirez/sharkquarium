import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillRoundRect } from '../engine/render.js';
import { TRACK_LIBRARY } from '../assets/tracks.js';
import {
  loadComposer,
  buildCustomTrack,
  composerHasNotes,
  composerNoteCount,
} from '../engine/composer.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

export class TrackPlayerScene extends Scene {
  enter() {
    this.time = 0;
    const composer = loadComposer();
    this.hasCustom = composerHasNotes(composer);
    this.customNotes = composerNoteCount(composer);
    this.status = null;
    this.statusTimer = 0;
    this.menu = new SelectList(
      [
        ...TRACK_LIBRARY.map((entry) => ({ label: entry.label, action: 'track', entry })),
        {
          label: 'MY TRACK',
          action: 'custom',
          blurb: this.hasCustom
            ? `YOUR SAVED COMPOSITION — ${this.customNotes} BLOCKS — PLAY IT OR EDIT IT`
            : 'NO NOTES YET — OPEN THE TRACK BUILDER TO COMPOSE ONE',
        },
        {
          label: 'RUSH MY TRACK',
          action: 'rush',
          blurb: this.hasCustom
            ? 'RUN REEF RUSH ON A COURSE BUILT FROM YOUR SONG'
            : 'COMPOSE A SONG FIRST — NOTES BECOME SPIKES, ROCKS, AND PEARLS',
        },
        { label: 'EDIT MY TRACK', action: 'builder', blurb: 'OPEN THE TRACK BUILDER' },
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
    if (!track || track.custom) return null;
    return TRACK_LIBRARY.find((entry) => entry.track === track) ?? null;
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2.6;
  }

  choose(item) {
    if (item.action === 'back') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('settings');
      return;
    }
    if (item.action === 'builder') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('trackbuilder');
      return;
    }
    if (item.action === 'rush') {
      if (!this.hasCustom) {
        this.setStatus('NO NOTES YET — COMPOSE ONE IN THE TRACK BUILDER');
        this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.18, volume: 0.2 });
        return;
      }
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('reefrush', { custom: true });
      return;
    }
    if (item.action === 'custom') {
      const track = this.game.music ? this.game.music.track : null;
      if (track && track.custom) {
        this.game.music.stop();
        this.game.audio.tone({ freq: 420, endFreq: 220, duration: 0.12, volume: 0.18 });
        return;
      }
      const composer = loadComposer();
      if (!composerHasNotes(composer)) {
        this.setStatus('NO NOTES YET — OPEN THE TRACK BUILDER TO COMPOSE ONE');
        this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.18, volume: 0.2 });
        return;
      }
      this.game.music.play(buildCustomTrack(composer));
      this.game.music.hold = true;
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
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
    this.statusTimer = Math.max(0, this.statusTimer - dt);
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
    drawText(ctx, 'PLAY ANY THEME — OR YOUR OWN SAVED TRACK', LOGICAL_WIDTH / 2, 84, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.8,
    });

    const selected = this.menu.selected;
    if (selected) {
      const blurb = selected.entry ? selected.entry.blurb : selected.blurb;
      if (blurb) {
        drawText(ctx, blurb, LOGICAL_WIDTH / 2, 106, {
          size: 12,
          color: COLORS.accent,
          alpha: 0.9,
        });
      }
    }

    this.menu.render(ctx, LOGICAL_WIDTH / 2, 310);
    this.renderNowPlaying(ctx);
    if (this.status && this.statusTimer > 0) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 150, {
        size: 12,
        color: COLORS.danger,
        alpha: Math.min(1, this.statusTimer),
      });
    }
    drawText(ctx, 'ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 22, {
      size: 12,
      color: COLORS.textDim,
    });
  }

  renderNowPlaying(ctx) {
    const track = this.game.music ? this.game.music.track : null;
    if (track && track.custom) {
      const startX = 268;
      for (let i = 0; i < 7; i += 1) {
        const height = 6 + (Math.sin(this.time * 7 + i * 0.9) + 1) * 7;
        fillRoundRect(ctx, startX + i * 11, 141 - height, 7, height, 2, COLORS.accent);
      }
      drawText(ctx, 'NOW PLAYING — MY TRACK', startX + 94, 134, {
        size: 12,
        color: COLORS.text,
        align: 'left',
      });
      return;
    }
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
