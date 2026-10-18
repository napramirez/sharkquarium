const RESTRICTED_WORDS = new Set(['return', 'throw', 'break', 'continue', 'yield']);

const REGEX_KEYWORDS = new Set([
  'return',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'case',
  'do',
  'else',
  'yield',
  'await',
]);

const REGEX_PRECEDING = "(,=:[!&|?{};+-*%~^<>";
const DROP_NEWLINE_AFTER = ';{[(,:?=';
const DROP_NEWLINE_BEFORE = ')]};,.[(';

const isWordChar = (ch) => ch !== undefined && /[A-Za-z0-9_$]/.test(ch);

const isWhitespace = (ch) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';

function needsSpace(prev, next) {
  if (prev === '' || next === undefined) return false;
  if (isWordChar(prev) && isWordChar(next)) return true;
  if ((prev === '+' && next === '+') || (prev === '-' && next === '-')) return true;
  if (prev === '/' && (next === '/' || next === '*')) return true;
  return false;
}

function canDropNewline(prev, next, word) {
  if (RESTRICTED_WORDS.has(word)) return false;
  if (prev === '' || next === undefined) return true;
  if (DROP_NEWLINE_AFTER.includes(prev)) return true;
  if (DROP_NEWLINE_BEFORE.includes(next)) return true;
  return false;
}

function scanString(code, start) {
  const quote = code[start];
  let i = start + 1;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) return i + 1;
    if (ch === '\n') return i;
    i += 1;
  }
  return i;
}

function scanTemplate(code, start) {
  let i = start + 1;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') return i + 1;
    if (ch === '$' && code[i + 1] === '{') {
      i += 2;
      let depth = 1;
      while (i < code.length && depth > 0) {
        const inner = code[i];
        if (inner === '{') {
          depth += 1;
          i += 1;
          continue;
        }
        if (inner === '}') {
          depth -= 1;
          i += 1;
          continue;
        }
        if (inner === "'" || inner === '"') {
          i = scanString(code, i);
          continue;
        }
        if (inner === '`') {
          i = scanTemplate(code, i);
          continue;
        }
        if (inner === '/' && code[i + 1] === '/') {
          i += 2;
          while (i < code.length && code[i] !== '\n') i += 1;
          continue;
        }
        if (inner === '/' && code[i + 1] === '*') {
          i += 2;
          while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i += 1;
          i += 2;
          continue;
        }
        i += 1;
      }
      continue;
    }
    i += 1;
  }
  return i;
}

function scanRegex(code, start) {
  let i = start + 1;
  let inClass = false;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '[') inClass = true;
    else if (ch === ']') inClass = false;
    else if (ch === '/' && !inClass) {
      i += 1;
      break;
    } else if (ch === '\n') break;
    i += 1;
  }
  while (i < code.length && isWordChar(code[i])) i += 1;
  return i;
}

function isRegexPosition(prev, word) {
  if (prev === '') return true;
  if (REGEX_PRECEDING.includes(prev)) return true;
  return REGEX_KEYWORDS.has(word);
}

export function minifyJs(code) {
  const out = [];
  const length = code.length;
  let i = 0;
  let prev = '';
  let word = '';

  const emit = (text) => {
    out.push(text);
    for (const ch of text) {
      prev = ch;
      if (isWordChar(ch)) word += ch;
      else word = '';
    }
  };

  while (i < length) {
    const ch = code[i];

    if (isWhitespace(ch)) {
      let j = i;
      let hasNewline = false;
      while (j < length && isWhitespace(code[j])) {
        if (code[j] === '\n') hasNewline = true;
        j += 1;
      }
      const next = code[j];
      if (hasNewline) {
        if (!canDropNewline(prev, next, word)) {
          out.push('\n');
        }
      } else if (needsSpace(prev, next)) {
        out.push(' ');
      }
      i = j;
      continue;
    }

    if (ch === "'" || ch === '"') {
      const end = scanString(code, i);
      emit(code.slice(i, end));
      i = end;
      continue;
    }

    if (ch === '`') {
      const end = scanTemplate(code, i);
      emit(code.slice(i, end));
      i = end;
      continue;
    }

    if (ch === '/' && code[i + 1] === '/') {
      i += 2;
      while (i < length && code[i] !== '\n') i += 1;
      continue;
    }

    if (ch === '/' && code[i + 1] === '*') {
      const start = i;
      i += 2;
      while (i < length && !(code[i] === '*' && code[i + 1] === '/')) i += 1;
      i = Math.min(length, i + 2);
      const comment = code.slice(start, i);
      if (comment.includes('\n')) {
        if (!canDropNewline(prev, code[i], word)) out.push('\n');
      } else if (needsSpace(prev, code[i])) {
        out.push(' ');
      }
      continue;
    }

    if (ch === '/') {
      if (isRegexPosition(prev, word)) {
        const end = scanRegex(code, i);
        emit(code.slice(i, end));
        i = end;
      } else {
        emit('/');
        i += 1;
      }
      continue;
    }

    if (isWordChar(ch)) {
      let j = i;
      while (j < length && isWordChar(code[j])) j += 1;
      emit(code.slice(i, j));
      i = j;
      continue;
    }

    emit(ch);
    i += 1;
  }

  return out.join('');
}

export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

export function minifyHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}
