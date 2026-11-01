let enabled = false;
let hidden = null;
let firstPerson = false;

export function setMode3D(on) {
  enabled = Boolean(on);
}

export function mode3D() {
  return enabled;
}

export function setHiddenEntity(entity) {
  hidden = entity ?? null;
}

export function hiddenEntity() {
  return hidden;
}

export function setFirstPersonMode(on) {
  firstPerson = Boolean(on);
}

export function firstPersonMode() {
  return firstPerson;
}
