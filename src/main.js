import { AudioBus } from './engine/audio.js';
import { Game } from './engine/game.js';
import { Input } from './engine/input.js';
import { loadJSON } from './engine/storage.js';
import { BootScene } from './scenes/boot.js';
import { IntroScene } from './scenes/intro.js';
import { TeleportScene } from './scenes/teleport.js';
import { MenuScene } from './scenes/menu.js';
import { TankSelectScene } from './scenes/tanks.js';
import { SettingsScene } from './scenes/settings.js';
import { ShopScene } from './scenes/shop.js';
import { MinigamesScene } from './scenes/minigames.js';
import { TrackPlayerScene } from './scenes/tracks.js';
import { TagScene } from './scenes/tag.js';
import { DodgeballScene } from './scenes/dodgeball.js';
import { PlayScene } from './scenes/play.js';
import { GameOverScene } from './scenes/gameover.js';
import { DawnScene } from './scenes/dawn.js';
import { AUDIO, LOGICAL_WIDTH, LOGICAL_HEIGHT, SETTINGS_KEY } from './config.js';

const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas element #game not found');

const input = new Input();
input.attach(canvas, LOGICAL_WIDTH, LOGICAL_HEIGHT);

const audio = new AudioBus();
const savedSettings = loadJSON(SETTINGS_KEY, {});
audio.setVolume(savedSettings.volume ?? AUDIO.volume);
audio.setSfxEnabled(savedSettings.sfx ?? true);
let audioUnlocked = false;
const unlockAudio = () => {
  if (audioUnlocked) return;
  audioUnlocked = true;
  audio.unlock();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('keydown', unlockAudio);
};
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

const game = new Game({
  canvas,
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT,
  input,
  audio,
});

game.register('boot', new BootScene());
game.register('intro', new IntroScene());
game.register('descent', new TeleportScene());
game.register('menu', new MenuScene());
game.register('tanks', new TankSelectScene());
game.register('settings', new SettingsScene());
game.register('shop', new ShopScene());
game.register('minigames', new MinigamesScene());
game.register('tracks', new TrackPlayerScene());
game.register('tag', new TagScene());
game.register('dodgeball', new DodgeballScene());
game.register('play', new PlayScene());
game.register('gameover', new GameOverScene());
game.register('dawn', new DawnScene());

game.changeScene('boot');
game.start();

globalThis.__game = game;
