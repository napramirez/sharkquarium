import {
  accessoryByKey,
  setActiveBodyAccessory,
  setActiveCostume,
  setActiveHeadAccessory,
} from './accessory.js';
import { auraByKey, auraForShop, setActiveAura } from './aura.js';
import { companionByKey, setActiveCompanion } from './companion.js';
import { setActiveSkin, skinByKey } from './skin.js';
import { setActiveTrail, trailByKey } from './trail.js';

function pairKey(shop, key, player) {
  return player === 1 ? shop[`${key}2`] ?? shop[key] : shop[key];
}

export function wardrobeFor(shop, player = 0) {
  return {
    skin: pairKey(shop, 'skin', player),
    head: pairKey(shop, 'head', player),
    back: pairKey(shop, 'back', player),
    costume: pairKey(shop, 'costume', player),
    trail: pairKey(shop, 'trail', player),
    companion: pairKey(shop, 'companion', player),
    aura: pairKey(shop, 'aura', player),
  };
}

export function applyWardrobe(shop, player = 0) {
  const wardrobe = wardrobeFor(shop, player);
  setActiveSkin(skinByKey(wardrobe.skin));
  if (wardrobe.aura) setActiveAura(auraByKey(wardrobe.aura));
  else setActiveAura(auraForShop(shop));
  setActiveHeadAccessory(accessoryByKey(wardrobe.head));
  setActiveBodyAccessory(accessoryByKey(wardrobe.back));
  setActiveCostume(accessoryByKey(wardrobe.costume));
  setActiveTrail(trailByKey(wardrobe.trail));
  setActiveCompanion(companionByKey(wardrobe.companion));
  return wardrobe;
}
