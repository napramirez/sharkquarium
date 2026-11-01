let reduced = false;

export function setReducedMotion(on) {
  reduced = Boolean(on);
}

export function reducedMotion() {
  return reduced;
}

export function motionScale() {
  return reduced ? 0 : 1;
}
