import { SEASON_TRACKS } from '../assets/tracks.js';

export const SEASONS = ['none', 'christmas', 'halloween', 'newyear'];

export const SEASON_LABELS = {
  none: 'OFF',
  christmas: 'CHRISTMAS',
  halloween: 'HALLOWEEN',
  newyear: 'NEW YEAR',
};

const SEASONAL_TRACKS = new Set(
  Object.values(SEASON_TRACKS).flatMap((mapping) => Object.values(mapping)),
);

let season = 'none';

export function setSeason(key) {
  season = SEASONS.includes(key) ? key : 'none';
}

export function currentSeason() {
  return season;
}

export function seasonOn() {
  return season !== 'none';
}

export function isSeason(key) {
  return season === key;
}

export function isSeasonalTrack(track) {
  return SEASONAL_TRACKS.has(track);
}

export function resolveSeasonTrack(track) {
  if (season === 'none' || !track) return track;
  const mapping = SEASON_TRACKS[season];
  return (mapping && mapping[track.name]) || track;
}