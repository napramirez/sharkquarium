import { AudioBus } from './engine/audio.js';
import { Game } from './engine/game.js';
import { Input } from './engine/input.js';
import { loadJSON } from './engine/storage.js';
import { setSeason } from './engine/season.js';
import { set8Bit } from './engine/retro.js';
import { BootScene } from './scenes/boot.js';
import { IntroScene } from './scenes/intro.js';
import { TeleportScene } from './scenes/teleport.js';
import { MenuScene } from './scenes/menu.js';
import { TankSelectScene } from './scenes/tanks.js';
import { SettingsScene } from './scenes/settings.js';
import { ShopScene } from './scenes/shop.js';
import { MinigamesScene } from './scenes/minigames.js';
import { TrackPlayerScene } from './scenes/tracks.js';
import { LoreScene } from './scenes/lore.js';
import { RecordsScene } from './scenes/records.js';
import { MutatorsScene } from './scenes/mutators.js';
import { TheatreScene } from './scenes/theatre.js';
import { TrailerScene } from './scenes/trailer.js';
import { TagScene } from './scenes/tag.js';
import { TagBoardScene } from './scenes/tagboard.js';
import { DodgeballScene } from './scenes/dodgeball.js';
import { PufferballScene } from './scenes/pufferball.js';
import { RoundupScene } from './scenes/roundup.js';
import { StealthScene } from './scenes/stealth.js';
import { TrenchScene } from './scenes/trench.js';
import { TrenchExploreScene } from './scenes/trenchexplore.js';
import { JellyAscentScene } from './scenes/jellyascent.js';
import { CleanupScene } from './scenes/cleanup.js';
import { LabyrinthScene } from './scenes/labyrinth.js';
import { AquariumScene } from './scenes/aquarium.js';
import { AbyssScene } from './scenes/abyss.js';
import { ReefQueenScene } from './scenes/reefqueen.js';
import { RaycastScene } from './scenes/raycast.js';
import { QuietScene } from './scenes/quiet.js';
import { WatcherScene } from './scenes/watcher.js';
import { MouthScene } from './scenes/mouth.js';
import { PrehistoricScene } from './scenes/prehistoric.js';
import { BossRushScene } from './scenes/bossrush.js';
import { PlayToyScene } from './scenes/playtoy.js';
import { ChristmasTrailScene } from './scenes/christmastrail.js';
import { ReefRushScene } from './scenes/reefrush.js';
import { RushBuilderScene } from './scenes/rushbuilder.js';
import { RushLevelsScene } from './scenes/rushlevels.js';
import { RushClearScene } from './scenes/rushclear.js';
import { TrackBuilderScene } from './scenes/trackbuilder.js';
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
game.set3D(savedSettings.threeD ?? false);
game.setFirstPerson(savedSettings.firstPerson ?? false);
setSeason(savedSettings.season ?? (savedSettings.christmas ? 'christmas' : 'none'));
set8Bit(savedSettings.eightBit ?? false);

game.register('boot', new BootScene());
game.register('intro', new IntroScene());
game.register('descent', new TeleportScene());
game.register('menu', new MenuScene());
game.register('tanks', new TankSelectScene());
game.register('settings', new SettingsScene());
game.register('shop', new ShopScene());
game.register('minigames', new MinigamesScene());
game.register('tracks', new TrackPlayerScene());
game.register('lore', new LoreScene());
game.register('records', new RecordsScene());
game.register('mutators', new MutatorsScene());
game.register('theatre', new TheatreScene());
game.register('trailer', new TrailerScene());
game.register('tag', new TagScene());
game.register('tagboard', new TagBoardScene());
game.register('dodgeball', new DodgeballScene());
game.register('pufferball', new PufferballScene());
game.register('roundup', new RoundupScene());
game.register('stealth', new StealthScene());
game.register('trench', new TrenchScene());
game.register('trenchexplore', new TrenchExploreScene());
game.register('jellyascent', new JellyAscentScene());
game.register('cleanup', new CleanupScene());
game.register('labyrinth', new LabyrinthScene());
game.register('aquarium', new AquariumScene());
game.register('abyss', new AbyssScene());
game.register('reefqueen', new ReefQueenScene());
game.register('raycast', new RaycastScene());
game.register('quiet', new QuietScene());
game.register('flood', new QuietScene());
game.register('watcher', new WatcherScene());
game.register('mouth', new MouthScene());
game.register('prehistoric', new PrehistoricScene());
game.register('bossrush', new BossRushScene());
game.register('playtoy', new PlayToyScene());
game.register('christmastrail', new ChristmasTrailScene());
game.register('reefrush', new ReefRushScene());
game.register('rushbuilder', new RushBuilderScene());
game.register('rushlevels', new RushLevelsScene());
game.register('rushclear', new RushClearScene());
game.register('trackbuilder', new TrackBuilderScene());
game.register('play', new PlayScene());
game.register('gameover', new GameOverScene());
game.register('dawn', new DawnScene());

const flushProgress = () => {
  if (game.scene && game.scene.saveProgress) game.scene.saveProgress();
};
window.addEventListener('pagehide', flushProgress);
window.addEventListener('beforeunload', flushProgress);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) flushProgress();
});

game.changeScene('boot');
game.start();

globalThis.__game = game;
