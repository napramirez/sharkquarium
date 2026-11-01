import { drawText } from './render.js';
import { mutatorByKey, scaleRules, drawMutatorDarkness } from './mutators.js';
import { DIFFICULTY, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class Scene {
  constructor() {
    this.game = null;
    this.name = '';
  }

  setMutator(key) {
    this.mutator = mutatorByKey(key);
  }

  set rules(value) {
    this._baseRules = value;
  }

  get rules() {
    const base = this._baseRules ?? DIFFICULTY.normal;
    return scaleRules(base, this.mutator);
  }

  renderMutatorOverlay(ctx) {
    if (!this.mutator || this.mutator.key === 'none') return;
    if (this.mutator.knobs.darkness) {
      const actor = this.firstPersonActor();
      const x = actor && actor.x != null ? actor.x : LOGICAL_WIDTH / 2;
      const y = actor && actor.y != null ? actor.y : LOGICAL_HEIGHT / 2;
      drawMutatorDarkness(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, x, y);
    }
    drawText(ctx, `MUTATOR ${this.mutator.label} · x${this.mutator.scoreMult}`, 16, LOGICAL_HEIGHT - 14, {
      size: 12,
      color: COLORS.accent,
      align: 'left',
      alpha: 0.9,
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 8,
    });
  }

  enter(_params) {}

  exit() {}

  update(_dt) {}

  render(_ctx) {}

  firstPersonActor() {
    if (this.divePlayer) return this.divePlayer;
    if (Array.isArray(this.players) && this.players.length > 0) return this.players[0];
    if (Array.isArray(this.swimmers) && this.swimmers.length > 0) return this.swimmers[0];
    if (this.player) return this.player;
    return null;
  }

  firstPersonSprites() {
    const list = [];
    if (Array.isArray(this.players)) list.push(...this.players);
    if (Array.isArray(this.swimmers)) list.push(...this.swimmers);
    if (this.divePlayer) list.push(this.divePlayer);
    return list;
  }

  firstPersonPalette() {
    return { top: '#04121c', bottom: '#01040a', wall: '#3a4a52' };
  }
}
