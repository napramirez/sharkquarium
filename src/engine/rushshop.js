import { loadJSON, saveJSON } from './storage.js';
import { RUSH_SHOP_KEY, SHOP_KEY, SKINS } from '../config.js';
import { isMeme } from './meme.js';

export function rushShopLadder() {
  return SKINS.filter((skin) => skin.rushOnly && (!skin.meme || isMeme()))
    .sort((a, b) => a.rushAt - b.rushAt);
}

export function rushSkinByKey(key) {
  return SKINS.find((skin) => skin.key === key) ?? null;
}

export function rushSkinUnlocked(skin, best) {
  return Boolean(skin && skin.rushOnly) && best >= Number(skin.rushAt || 0);
}

export function loadRushShop() {
  const saved = loadJSON(RUSH_SHOP_KEY, {});
  return { best: Math.max(0, Math.round(Number(saved.best) || 0)) };
}

export function saveRushShop(state) {
  saveJSON(RUSH_SHOP_KEY, { best: Math.max(0, Math.round(Number(state.best) || 0)) });
}

export function equippedFormSkins() {
  const shop = loadJSON(SHOP_KEY, {});
  return shop.rushForm && typeof shop.rushForm === 'object' ? { ...shop.rushForm } : {};
}

export function equipFormSkin(form, key) {
  const shop = loadJSON(SHOP_KEY, {});
  const map = shop.rushForm && typeof shop.rushForm === 'object' ? { ...shop.rushForm } : {};
  if (!key || key === 'default') delete map[form];
  else map[form] = key;
  shop.rushForm = map;
  saveJSON(SHOP_KEY, shop);
  return map;
}

export function bankRushDistance(distance) {
  const state = loadRushShop();
  const best = Math.max(state.best, Math.round(Number(distance) || 0));
  const shop = loadJSON(SHOP_KEY, {});
  const owned = Array.isArray(shop.owned) ? shop.owned.slice() : ['natural'];
  const granted = [];
  for (const skin of rushShopLadder()) {
    if (best >= skin.rushAt && !owned.includes(skin.key)) {
      owned.push(skin.key);
      granted.push(skin);
    }
  }
  if (best !== state.best) saveRushShop({ best });
  if (granted.length > 0) {
    shop.owned = owned;
    saveJSON(SHOP_KEY, shop);
  }
  return { best, granted };
}
