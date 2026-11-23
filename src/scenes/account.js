import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect, measureTextWidth } from '../engine/render.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';
import {
  currentAccount,
  createAccount,
  login,
  saveAccount,
  logout,
  listAccounts,
  currentTransferCode,
  claimTransferCode,
  revealPassword,
  deleteAccount,
} from '../engine/accounts.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const KEY_LETTER = /^Key[A-Z]$/;
const KEY_DIGIT = /^Digit[0-9]$/;

export class AccountScene extends Scene {
  enter() {
    this.time = 0;
    this.phase = 'list';
    this.activeField = 0;
    this.inputText = ['', ''];
    this.code = null;
    this.copied = false;
    this.status = null;
    this.statusTimer = 0;
    this.rebuild();
  }

  fields() {
    switch (this.phase) {
      case 'create':
      case 'login':
        return [{ label: 'NAME' }, { label: 'PASSWORD', mask: true }];
      case 'import':
        return [
          { label: 'TRANSFER CODE (5\u20137 DIGITS, MAY END IN A LETTER)', paste: true },
          { label: 'PASSWORD', mask: true },
          { label: 'ACCOUNT NAME (OPTIONAL)' },
        ];
      default:
        return [];
    }
  }

  rebuild() {
    const account = currentAccount();
    const accounts = listAccounts();
    const items = [];
    if (account) {
      items.push({ label: `SIGNED IN: ${account}`, action: 'none', disabled: true });
      items.push({ label: 'SAVE PROGRESS', action: 'save' });
      items.push({ label: 'TRANSFER CODE', action: 'showcode' });
      items.push({ label: 'FORGOT PASSWORD', action: 'forgot' });
      items.push({ label: 'DELETE ACCOUNT', action: 'delete' });
      items.push({ label: 'LOG OUT', action: 'logout' });
      items.push({ label: 'ENTER TRANSFER CODE', action: 'import' });
    } else {
      items.push({ label: 'CREATE ACCOUNT', action: 'create' });
      items.push({ label: 'LOG IN', action: 'login' });
      for (const entry of accounts) {
        items.push({ label: `SIGN IN: ${entry.name}`, action: 'login', name: entry.name });
      }
      items.push({ label: 'FORGOT PASSWORD', action: 'forgot' });
      items.push({ label: 'DELETE ACCOUNT', action: 'delete' });
      items.push({ label: 'ENTER TRANSFER CODE', action: 'import' });
      items.push({ label: `ACCOUNTS ON THIS DEVICE: ${accounts.length}`, action: 'none', disabled: true });
    }
    items.push({ label: 'BACK', action: 'back' });
    this.menu = new SelectList(items, {
      glowColor: COLORS.bubble,
      accentColor: COLORS.accent,
      color: COLORS.text,
      spacing: 34,
      fontSize: 18,
      visible: 11,
      wheel: true,
      onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
      onConfirm: (item) => this.choose(item),
    });
    this.menu.reset();
  }

  openPicker(phase) {
    const accounts = listAccounts();
    const action = phase === 'delete' ? 'doDelete' : 'reveal';
    const items = accounts.map((entry) => ({ label: entry.name, action, name: entry.name }));
    if (!accounts.length) items.push({ label: 'NO ACCOUNTS ON THIS DEVICE', action: 'none', disabled: true });
    items.push({ label: 'BACK', action: 'back' });
    this.pickerMenu = new SelectList(items, {
      glowColor: COLORS.bubble,
      accentColor: COLORS.accent,
      color: COLORS.text,
      spacing: 40,
      fontSize: 20,
      onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
      onConfirm: (item) => this.choose(item),
    });
    this.pickerMenu.reset();
    this.phase = phase;
  }

  reveal(name) {
    const password = revealPassword(name);
    if (password === null) this.setStatus(`NO SAVED PASSWORD FOR ${name}`);
    else this.setStatus(`${name}'S KEYED PASSWORD IS: ${password}`);
    this.game.audio.tone({ freq: 620, endFreq: 880, type: 'triangle', duration: 0.16, volume: 0.2 });
    this.phase = 'list';
    this.rebuild();
  }

  removeAccount(name) {
    const result = deleteAccount(name);
    this.setStatus(result.ok ? `ACCOUNT "${result.name}" DELETED` : result.error);
    this.game.audio.tone({ freq: 300, endFreq: 120, type: 'square', duration: 0.2, volume: 0.22 });
    this.phase = 'list';
    this.rebuild();
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 3;
  }

  startPhase(phase) {
    this.phase = phase;
    this.activeField = 0;
    this.code = null;
    this.copied = false;
    this.inputText = this.fields().map(() => '');
  }

  showTransferCode() {
    const result = currentTransferCode();
    if (!result.ok) {
      this.setStatus(result.error);
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.2 });
      return;
    }
    this.phase = 'showcode';
    this.activeField = 0;
    this.inputText = [];
    this.code = result.code;
    this.copied = false;
    this.copyCode();
    this.setStatus('MEMORISE OR COPY THIS CODE, THEN ENTER IT WITH YOUR NAME AND PASSWORD ELSEWHERE');
    this.game.audio.tone({ freq: 520, endFreq: 900, type: 'triangle', duration: 0.24, volume: 0.22 });
  }

  copyCode() {
    if (!this.code) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.code).then(() => {
        this.copied = true;
      }).catch(() => {});
    }
    this.game.audio.tone({ freq: 600, endFreq: 820, duration: 0.1, volume: 0.16 });
  }

  choose(item) {
    if (item.disabled) return;
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (item.action === 'back') {
      if (this.phase === 'forgot' || this.phase === 'delete') {
        this.phase = 'list';
        this.rebuild();
        return;
      }
      this.game.changeScene('menu');
      return;
    }
    if (item.action === 'reveal') {
      this.reveal(item.name);
      return;
    }
    if (item.action === 'doDelete') {
      this.removeAccount(item.name);
      return;
    }
    if (item.action === 'forgot') {
      const account = currentAccount();
      if (account) this.reveal(account);
      else this.openPicker('forgot');
      return;
    }
    if (item.action === 'delete') {
      this.openPicker('delete');
      return;
    }
    if (item.action === 'showcode') {
      this.showTransferCode();
      return;
    }
    if (item.action === 'create' || item.action === 'login' || item.action === 'import') {
      this.startPhase(item.action);
      if (item.action === 'login' && item.name) {
        this.inputText = [item.name, ''];
        this.activeField = 1;
      }
      return;
    }
    if (item.action === 'save') {
      const result = saveAccount();
      this.setStatus(result.ok ? 'PROGRESS SAVED TO YOUR ACCOUNT' : result.error);
      return;
    }
    if (item.action === 'logout') {
      saveAccount();
      logout();
      this.setStatus('SIGNED OUT');
      this.rebuild();
    }
  }

  submit() {
    const t = this.inputText;
    if (this.phase === 'create') {
      const result = createAccount(t[0], t[1]);
      this.afterAuth(result, 'ACCOUNT CREATED');
      return;
    }
    if (this.phase === 'login') {
      const result = login(t[0], t[1]);
      this.afterAuth(result, 'SIGNED IN');
      return;
    }
    if (this.phase === 'import') {
      const result = claimTransferCode(t[0], t[1], t[2]);
      if (!result.ok) {
        this.setStatus(result.error);
        this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.2 });
        return;
      }
      this.setStatus(`ACCOUNT "${result.name}" CLAIMED \u2014 YOU ARE SIGNED IN`);
      this.game.audio.tone({ freq: 520, endFreq: 900, type: 'triangle', duration: 0.24, volume: 0.22 });
      this.phase = 'list';
      this.rebuild();
    }
  }

  afterAuth(result, verb) {
    if (!result.ok) {
      this.setStatus(result.error);
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.2 });
      return;
    }
    this.setStatus(`${verb} \u2014 ${result.name}`);
    this.game.audio.tone({ freq: 520, endFreq: 900, type: 'triangle', duration: 0.24, volume: 0.22 });
    this.phase = 'list';
    this.rebuild();
  }

  updateTyping(input) {
    const fields = this.fields();
    const field = fields[this.activeField] ?? {};
    const maxLen = field.wide ? 4000 : 12;
    for (const code of input.pressed) {
      if (code === 'Backspace') {
        this.inputText[this.activeField] = this.inputText[this.activeField].slice(0, -1);
      } else if (code === 'Tab') {
        this.activeField = (this.activeField + 1) % fields.length;
        this.game.audio.tone({ freq: 560, duration: 0.05, volume: 0.1 });
      } else if (KEY_LETTER.test(code) && this.inputText[this.activeField].length < maxLen) {
        this.inputText[this.activeField] += code.slice(3);
      } else if (KEY_DIGIT.test(code) && this.inputText[this.activeField].length < maxLen) {
        this.inputText[this.activeField] += code.slice(5);
      }
    }
    if (input.pasted) {
      const val = field.wide ? input.pasted.replace(/\s+/g, '') : input.pasted.slice(0, maxLen);
      this.inputText[this.activeField] = (this.inputText[this.activeField] + val).slice(0, maxLen);
      this.game.audio.tone({ freq: 600, endFreq: 800, duration: 0.1, volume: 0.14 });
    }
    if (input.wasPressed('confirm')) {
      if (this.activeField < fields.length - 1 && this.inputText[this.activeField]) {
        this.activeField += 1;
        this.game.audio.tone({ freq: 560, duration: 0.06, volume: 0.12 });
        return;
      }
      this.submit();
    }
  }

  update(dt) {
    this.time += dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    const input = this.game.input;
    if (input.wasPressed('back')) {
      if (this.phase !== 'list') {
        this.phase = 'list';
        this.rebuild();
      } else {
        this.game.changeScene('menu');
      }
      return;
    }
    if (this.phase === 'list') this.menu.update(dt, input);
    else if (this.phase === 'forgot' || this.phase === 'delete') this.pickerMenu.update(dt, input);
    else if (this.phase === 'showcode') {
      if (input.wasPressed('confirm')) this.copyCode();
    } else this.updateTyping(input);
  }

  renderField(ctx, index, y) {
    const fields = this.fields();
    const field = fields[index];
    const active = this.activeField === index;
    drawText(ctx, field.label, W / 2 - 300, y - 34, { size: 12, color: active ? COLORS.accent : COLORS.textDim, align: 'left' });
    fillRoundRect(ctx, W / 2 - 300, y - 22, 600, 44, 12, 'rgba(10, 39, 64, 0.85)');
    strokeRoundRect(ctx, W / 2 - 300, y - 22, 600, 44, 12, active ? COLORS.accent : 'rgba(207, 239, 255, 0.3)', active ? 2.5 : 1.5);
    const raw = this.inputText[index];
    let shown = raw;
    if (field.mask) shown = raw.replace(/./g, '\u2022');
    if (field.wide && shown.length > 44) shown = `\u2026${shown.slice(-44)}`;
    if (shown) {
      drawText(ctx, shown, W / 2 - 284, y, { size: field.wide ? 12 : 22, color: COLORS.text, align: 'left' });
    } else if (!active) {
      drawText(ctx, field.mask ? 'YOUR PASSWORD' : 'TYPE HERE', W / 2 - 284, y, {
        size: 20,
        color: COLORS.textDim,
        alpha: 0.4,
        align: 'left',
      });
    }
    if (active && Math.sin(this.time * 7) > 0 && !field.wide) {
      fillRoundRect(ctx, W / 2 - 284 + measureTextWidth(ctx, shown, 22) + 1, y - 12, 3, 24, 1.5, COLORS.accent);
    }
  }

  renderCode(ctx) {
    if (!this.code) return;
    const per = Math.max(1, Math.floor(780 / Math.max(1, measureTextWidth(ctx, 'M', 12))));
    const window = this.code.slice(0, per * 8);
    const shown = [];
    for (let i = 0; i < window.length; i += per) shown.push(window.slice(i, i + per));
    const boxH = shown.length * 16 + 20;
    fillRoundRect(ctx, W / 2 - 400, 220, 800, boxH, 12, 'rgba(2, 10, 18, 0.9)');
    strokeRoundRect(ctx, W / 2 - 400, 220, 800, boxH, 12, 'rgba(207, 239, 255, 0.4)', 1.5);
    shown.forEach((line, i) => {
      drawText(ctx, line, W / 2 - 384, 238 + i * 16, { size: 12, color: '#bfe9ff', align: 'left' });
    });
    drawText(
      ctx,
      this.copied ? 'COPIED TO CLIPBOARD' : 'SELECT-AND-COPY THE CODE ABOVE',
      W / 2,
      220 + boxH + 18,
      { size: 13, color: this.copied ? COLORS.accent : COLORS.textDim },
    );
  }

  render(ctx) {
    drawWater(ctx, W, H, this.time, WATER_PALETTE);
    ctx.fillStyle = 'rgba(6, 26, 42, 0.35)';
    ctx.fillRect(0, 0, W, H);

    drawText(ctx, 'ACCOUNT', W / 2, 70, { size: 34, color: COLORS.text, glow: COLORS.bubble, glowBlur: 20 });
    drawText(ctx, 'A NAME AND A CUSTOM PASSWORD SAVE YOUR PROGRESS \u2014 THE SAME PASSWORD WORKS ON ANY DEVICE', W / 2, 100, {
      size: 11,
      color: COLORS.foam,
      alpha: 0.85,
    });

    const account = currentAccount();
    drawText(ctx, account ? `SIGNED IN AS ${account}` : 'NOT SIGNED IN', W / 2, 134, {
      size: 15,
      color: account ? COLORS.accent : COLORS.textDim,
    });

    if (this.phase === 'list') {
      drawText(ctx, 'ACCOUNTS ARE STORED ON THIS DEVICE; USE A TRANSFER CODE TO MOVE ONE', W / 2, 168, {
        size: 10,
        color: COLORS.textDim,
        alpha: 0.7,
      });
      this.menu.render(ctx, W / 2, 350);
    } else if (this.phase === 'forgot' || this.phase === 'delete') {
      const del = this.phase === 'delete';
      drawText(ctx, del ? 'DELETE ACCOUNT' : 'FORGOT PASSWORD', W / 2, 168, { size: 22, color: del ? COLORS.danger : COLORS.accent });
      drawText(
        ctx,
        del ? 'CLICK AN ACCOUNT TO DELETE IT FROM THIS DEVICE RIGHT AWAY' : 'PICK AN ACCOUNT TO SHOW THE PASSWORD YOU KEYED FOR IT',
        W / 2,
        194,
        { size: 12, color: COLORS.foam, alpha: 0.85 },
      );
      this.pickerMenu.render(ctx, W / 2, 330);
    } else {
      const titles = { create: 'CREATE ACCOUNT', login: 'LOG IN', showcode: 'TRANSFER CODE', import: 'ENTER TRANSFER CODE' };
      drawText(ctx, titles[this.phase], W / 2, 168, { size: 22, color: COLORS.accent });
      if (this.phase === 'import') {
        drawText(ctx, 'ENTER YOUR SHORT CODE AND PASSWORD \u2014 THE ACCOUNT NAME IS OPTIONAL', W / 2, 192, {
          size: 12,
          color: COLORS.foam,
          alpha: 0.85,
        });
      }
      if (this.phase === 'showcode') {
        drawText(ctx, 'MEMORISE OR COPY THIS CODE, THEN ENTER IT WITH YOUR NAME AND PASSWORD ELSEWHERE', W / 2, 192, {
          size: 12,
          color: COLORS.foam,
          alpha: 0.85,
        });
      }
      if (this.phase === 'showcode' && this.code) {
        this.renderCode(ctx);
      } else {
        const fields = this.fields();
        const top = 260;
        fields.forEach((f, i) => this.renderField(ctx, i, top + i * (f.wide ? 66 : 78)));
      }
      drawText(ctx, 'TYPE  \u00B7  CTRL+V PASTES A CODE  \u00B7  TAB SWITCHES  \u00B7  ENTER CONTINUES  \u00B7  ESC BACK', W / 2, 470, {
        size: 11,
        color: COLORS.textDim,
        alpha: 0.8,
      });
    }

    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, W / 2, H - 58, { size: 15, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    drawText(ctx, 'UP / DOWN \u2014 CHOOSE      ENTER \u2014 SELECT      ESC \u2014 BACK', W / 2, H - 24, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.72,
    });
  }
}
