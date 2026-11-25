import { cute } from './cute.js';

let reduced = false;
let shakeOn = true;
let flashOn = true;

export function setReducedMotion(on) {
  reduced = Boolean(on);
}

export function setShakeEnabled(on) {
  shakeOn = Boolean(on);
}

export function setFlashEnabled(on) {
  flashOn = Boolean(on);
}

export function reducedMotion() {
  return reduced;
}

export function shakeEnabled() {
  return shakeOn;
}

export function flashEnabled() {
  return flashOn;
}

export function motionScale() {
  return reduced || cute() ? 0 : 1;
}

export function shakeScale() {
  return shakeOn ? motionScale() : 0;
}

export function flashScale() {
  return flashOn ? motionScale() : 0;
}
