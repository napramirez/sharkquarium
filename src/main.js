import { AudioBus } from './engine/audio.js';
import { Game } from './engine/game.js';
import { Input } from './engine/input.js';
import { BootScene } from './scenes/boot.js';
import { MenuScene } from './scenes/menu.js';
import { PlayScene } from './scenes/play.js';
import { GameOverScene } from './scenes/gameover.js';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './config.js';

const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas element #game not found');

const input = new Input();
input.attach(canvas, LOGICAL_WIDTH, LOGICAL_HEIGHT);

const audio = new AudioBus();
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
game.register('menu', new MenuScene());
game.register('play', new PlayScene());
game.register('gameover', new GameOverScene());

game.changeScene('boot');
game.start();

globalThis.__game = game;
