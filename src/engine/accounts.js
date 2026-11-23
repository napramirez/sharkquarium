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

const CODE_LETTERS = 'ABCD';

function randomCode() {
  let out = '';
  for (let i = 0; i < 6; i += 1) out += Math.floor(Math.random() * 10);
  if (out[0] === '0') out = String(1 + Math.floor(Math.random() * 9)) + out.slice(1);
  return out;
}

function codeLetter(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) sum = (sum + Number(digits[i]) * (i + 1)) % 26;
  return CODE_LETTERS[sum % CODE_LETTERS.length];
}

function parseCode(code) {
  const clean = String(code).toUpperCase().replace(/[^0-9A-D]/g, '');
  const match = clean.match(/^([0-9]{5,7})([A-D])?$/);
  return match ? { digits: match[1], letter: match[2] ?? null } : null;
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
    code: randomCode(),
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

export function currentTransferCode() {
  const key = currentAccount();
  if (!key) return { ok: false, error: 'NOT SIGNED IN' };
  const data = loadJSON(ACCOUNTS_KEY, {});
  const account = data[key];
  if (!account) return { ok: false, error: 'NOT SIGNED IN' };
  let digits = account.code;
  if (!digits) {
    digits = randomCode();
    account.code = digits;
    saveJSON(ACCOUNTS_KEY, data);
  }
  return { ok: true, code: digits + codeLetter(digits) };
}

export function claimTransferCode(code, password, name) {
  const parsed = parseCode(code);
  if (!parsed) return { ok: false, error: 'NOT A TRANSFER CODE' };
  if (!password) return { ok: false, error: 'ENTER A PASSWORD' };
  const data = loadJSON(ACCOUNTS_KEY, {});
  const local = Object.values(data).find((account) => account.code === parsed.digits);
  const chosen = typeof name === 'string' ? name.trim() : '';
  const key = chosen
    ? chosen.toUpperCase().slice(0, 12)
    : local?.name ?? `DIVER ${parsed.digits}`;
  const existing = data[key];
  const salt = Math.floor(Math.random() * 0x7fffffff);
  data[key] = {
    name: key,
    salt,
    hash: hash(password, salt),
    keyed: rememberKeyed(password),
    created: existing?.created ?? local?.created ?? Date.now(),
    saved: Date.now(),
    code: parsed.digits,
    progress: existing?.progress ?? local?.progress ?? snapshotProgress(),
  };
  saveJSON(ACCOUNTS_KEY, data);
  saveJSON(CURRENT_KEY, key);
  return { ok: true, name: key };
}
