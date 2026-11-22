import { loadJSON, saveJSON } from './storage.js';

const ACCOUNTS_KEY = 'sharkquarium.accounts';
const CURRENT_KEY = 'sharkquarium.account.current';
const PREFIX = 'sharkquarium.';
const EXCLUDE = new Set([ACCOUNTS_KEY, CURRENT_KEY]);

function hash(text, salt) {
  let h = 2166136261 ^ salt;
  const s = `${salt}:${text}`;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function rememberKeyed(password) {
  let out = '';
  for (let i = 0; i < password.length; i += 1) {
    out += String.fromCharCode(password.charCodeAt(i) + 17);
  }
  return out;
}

function recallKeyed(keyed) {
  if (typeof keyed !== 'string') return null;
  let out = '';
  for (let i = 0; i < keyed.length; i += 1) {
    out += String.fromCharCode(keyed.charCodeAt(i) - 17);
  }
  return out;
}

export function revealPassword(name) {
  const key = String(name).trim().toUpperCase();
  const account = loadJSON(ACCOUNTS_KEY, {})[key];
  if (!account) return null;
  return recallKeyed(account.keyed);
}

function eachProgressKey(visit) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX) && !EXCLUDE.has(key)) keys.push(key);
  }
  for (const key of keys) visit(key);
}

export function listAccounts() {
  const data = loadJSON(ACCOUNTS_KEY, {});
  return Object.values(data).map((account) => ({ name: account.name, created: account.created }));
}

export function currentAccount() {
  const key = loadJSON(CURRENT_KEY, null);
  return typeof key === 'string' && key ? key : null;
}

export function snapshotProgress() {
  const snap = {};
  eachProgressKey((key) => {
    snap[key] = localStorage.getItem(key);
  });
  return snap;
}

export function restoreProgress(snap) {
  eachProgressKey((key) => localStorage.removeItem(key));
  if (snap) {
    for (const [key, value] of Object.entries(snap)) {
      if (typeof value === 'string') localStorage.setItem(key, value);
    }
  }
}

export function createAccount(name, password) {
  const key = String(name).trim().toUpperCase().slice(0, 12);
  if (!key) return { ok: false, error: 'ENTER A NAME' };
  if (!password) return { ok: false, error: 'ENTER A PASSWORD' };
  const data = loadJSON(ACCOUNTS_KEY, {});
  if (data[key]) return { ok: false, error: 'NAME ALREADY TAKEN' };
  const salt = Math.floor(Math.random() * 0x7fffffff);
  data[key] = {
    name: key,
    salt,
    hash: hash(password, salt),
    keyed: rememberKeyed(password),
    created: Date.now(),
    saved: Date.now(),
    progress: snapshotProgress(),
  };
  saveJSON(ACCOUNTS_KEY, data);
  saveJSON(CURRENT_KEY, key);
  return { ok: true, name: key };
}

export function login(name, password) {
  const key = String(name).trim().toUpperCase().slice(0, 12);
  const data = loadJSON(ACCOUNTS_KEY, {});
  const account = data[key];
  if (!account) return { ok: false, error: 'NO SUCH ACCOUNT' };
  if (hash(password, account.salt) !== account.hash) return { ok: false, error: 'WRONG PASSWORD' };
  account.keyed = rememberKeyed(password);
  saveJSON(ACCOUNTS_KEY, data);
  restoreProgress(account.progress);
  saveJSON(CURRENT_KEY, key);
  return { ok: true, name: key };
}

export function saveAccount() {
  const key = currentAccount();
  if (!key) return { ok: false, error: 'NOT SIGNED IN' };
  const data = loadJSON(ACCOUNTS_KEY, {});
  if (!data[key]) return { ok: false, error: 'NOT SIGNED IN' };
  data[key].progress = snapshotProgress();
  data[key].saved = Date.now();
  saveJSON(ACCOUNTS_KEY, data);
  return { ok: true, name: key };
}

export function logout() {
  localStorage.removeItem(CURRENT_KEY);
}

export function deleteAccount(name) {
  const key = String(name).trim().toUpperCase();
  const data = loadJSON(ACCOUNTS_KEY, {});
  if (!data[key]) return { ok: false, error: 'NO SUCH ACCOUNT' };
  delete data[key];
  saveJSON(ACCOUNTS_KEY, data);
  if (currentAccount() === key) localStorage.removeItem(CURRENT_KEY);
  return { ok: true, name: key };
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? '=' : B64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? '=' : B64[b2 & 63];
  }
  return out;
}

function fromBase64(str) {
  const clean = String(str).replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64.indexOf(clean[i]);
    const c1 = B64.indexOf(clean[i + 1] ?? 'A');
    const c2 = B64.indexOf(clean[i + 2] ?? 'A');
    const c3 = B64.indexOf(clean[i + 3] ?? 'A');
    bytes.push(((c0 & 63) << 2) | (c1 >> 4));
    if (clean[i + 2] !== undefined) bytes.push(((c1 & 15) << 4) | (c2 >> 2));
    if (clean[i + 3] !== undefined) bytes.push(((c2 & 3) << 6) | (c3 & 63));
  }
  return bytes;
}

function utf8Encode(str) {
  const bytes = [];
  for (const ch of str) {
    const c = ch.codePointAt(0);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return bytes;
}

function utf8Decode(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    if (b < 0x80) {
      out += String.fromCharCode(b);
      i += 1;
    } else if (b < 0xe0) {
      out += String.fromCharCode(((b & 31) << 6) | (bytes[i + 1] & 63));
      i += 2;
    } else if (b < 0xf0) {
      out += String.fromCharCode(((b & 15) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63));
      i += 3;
    } else {
      const cp = ((b & 7) << 18) | ((bytes[i + 1] & 63) << 12) | ((bytes[i + 2] & 63) << 6) | (bytes[i + 3] & 63);
      out += String.fromCodePoint(cp);
      i += 4;
    }
  }
  return out;
}

function keystream(password, salt, length) {
  const out = new Uint8Array(length);
  let i = 0;
  let counter = 0;
  while (i < length) {
    const block = hash(`${password}:${salt}:${counter}`, salt);
    for (let k = 0; k < block.length && i < length; k += 1, i += 1) {
      out[i] = block.charCodeAt(k) & 0xff;
    }
    counter += 1;
  }
  return out;
}

function xorBytes(bytes, stream) {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) out[i] = bytes[i] ^ stream[i];
  return out;
}

function toDigits(bytes) {
  let out = '';
  for (const b of bytes) out += String(b).padStart(3, '0');
  return out;
}

function fromDigits(str) {
  const clean = String(str).replace(/\D/g, '');
  if (clean.length < 3 || clean.length % 3 !== 0) return null;
  const bytes = [];
  for (let i = 0; i < clean.length; i += 3) {
    const v = Number(clean.slice(i, i + 3));
    if (!Number.isInteger(v) || v > 255) return null;
    bytes.push(v);
  }
  return bytes;
}

export function exportTransfer(password) {
  const key = currentAccount();
  if (!key) return { ok: false, error: 'NOT SIGNED IN' };
  const account = loadJSON(ACCOUNTS_KEY, {})[key];
  if (!account) return { ok: false, error: 'NOT SIGNED IN' };
  if (hash(password, account.salt) !== account.hash) return { ok: false, error: 'WRONG PASSWORD' };
  const plain = utf8Encode(JSON.stringify(account.progress ?? {}));
  const blob = xorBytes(plain, keystream(password, account.salt, plain.length));
  const payload = JSON.stringify({ n: account.name, s: account.salt, c: account.created, d: toBase64(Array.from(blob)) });
  return { ok: true, code: toDigits(utf8Encode(payload)) };
}

export function importTransfer(code, password) {
  const bytes = fromDigits(code);
  if (!bytes) return { ok: false, error: 'NOT A TRANSFER CODE' };
  let payload;
  try {
    payload = JSON.parse(utf8Decode(bytes));
  } catch {
    return { ok: false, error: 'CORRUPT TRANSFER CODE' };
  }
  const name = String(payload.n ?? '').trim().toUpperCase().slice(0, 12);
  const salt = Number(payload.s);
  if (!name || !Number.isFinite(salt) || typeof payload.d !== 'string') {
    return { ok: false, error: 'CORRUPT TRANSFER CODE' };
  }
  let progress;
  try {
    const blob = fromBase64(payload.d);
    progress = JSON.parse(utf8Decode(xorBytes(blob, keystream(password, salt, blob.length))));
  } catch {
    return { ok: false, error: 'WRONG PASSWORD' };
  }
  if (!progress || typeof progress !== 'object') return { ok: false, error: 'WRONG PASSWORD' };
  const data = loadJSON(ACCOUNTS_KEY, {});
  data[name] = {
    name,
    salt,
    hash: hash(password, salt),
    keyed: rememberKeyed(password),
    created: Number(payload.c) || Date.now(),
    saved: Date.now(),
    progress,
  };
  saveJSON(ACCOUNTS_KEY, data);
  restoreProgress(progress);
  saveJSON(CURRENT_KEY, name);
  return { ok: true, name };
}
