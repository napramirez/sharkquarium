import { cute } from './cute.js';

let reduced = false;

export function setReducedMotion(on) {
  reduced = Boolean(on);
}

export function reducedMotion() {
  return reduced;
}

export function motionScale() {
  return reduced || cute() ? 0 : 1;
}
