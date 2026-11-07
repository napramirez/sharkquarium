let eightBit = false;

export function set8Bit(on) {
  eightBit = Boolean(on);
}

export function is8Bit() {
  return eightBit;
}

export const PIXEL_WIDTH = 256;
export const PIXEL_HEIGHT = 144;