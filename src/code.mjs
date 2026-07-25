// Code structure fingerprinting. The point is that renaming every variable and
// reformatting the file should not change the fingerprint: identifiers collapse
// to V, literals to S/N, and only structure survives. A fork with a new name
// still matches its parent.

const KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'yield',
  'function', 'fn', 'def', 'lambda', 'class', 'struct', 'enum', 'impl', 'trait', 'interface', 'type',
  'let', 'const', 'var', 'mut', 'static', 'pub', 'private', 'public', 'protected', 'internal', 'external',
  'import', 'export', 'from', 'use', 'mod', 'require', 'package', 'namespace',
  'new', 'this', 'self', 'super', 'null', 'nil', 'none', 'true', 'false', 'undefined',
  'async', 'await', 'try', 'catch', 'except', 'finally', 'throw', 'raise', 'panic',
  'match', 'in', 'is', 'as', 'and', 'or', 'not', 'with', 'pass', 'elif',
  'mapping', 'contract', 'modifier', 'event', 'emit', 'payable', 'view', 'memory', 'storage',
  'unsafe', 'where', 'dyn', 'ref', 'move', 'crate', 'derive'
]);

export function tokenizeCode(source) {
  let text = String(source ?? '');
  text = text.replace(/\/\*[\s\S]*?\*\//g, ' ');            // block comments
  text = text.replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');        // line comments, keeping URLs mostly intact
  text = text.replace(/^\s*#[^\n]*/gm, ' ');                // hash comments / attributes
  text = text.replace(/"(?:[^"\\\n]|\\.)*"/g, ' " S " ');
  text = text.replace(/'(?:[^'\\\n]|\\.)*'/g, ' " S " ');
  text = text.replace(/`(?:[^`\\]|\\.)*`/g, ' " S " ');

  const tokens = [];
  const pattern = /[A-Za-z_$][A-Za-z0-9_$]*|\d+(?:\.\d+)?|[{}()[\];,.:<>=!+\-*/%&|^~?@#]/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const raw = match[0];
    if (/^\d/.test(raw)) { tokens.push('N'); continue; }
    if (/^[A-Za-z_$]/.test(raw)) {
      const lower = raw.toLowerCase();
      tokens.push(lower === 's' ? 'S' : KEYWORDS.has(lower) ? lower : 'V');
      continue;
    }
    tokens.push(raw);
  }
  return tokens;
}

function hashGram(tokens, start, k) {
  let hash = 0x811c9dc5;
  for (let i = start; i < start + k; i++) {
    const token = tokens[i];
    for (let c = 0; c < token.length; c++) {
      hash ^= token.charCodeAt(c);
      hash = Math.imul(hash, 0x01000193);
    }
    hash ^= 0x2f;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// Winnowing (Schleimer/Wilkerson/Aiken): hash every k-gram, then keep the
// minimum in each sliding window of w. Gives a stable, position-independent
// subset instead of every gram, so small insertions don't shift the whole set.
export function codeFingerprint(source, { k = 5, w = 4 } = {}) {
  const tokens = tokenizeCode(source);
  const prints = new Set();
  if (tokens.length < k) return { tokenCount: tokens.length, prints };
  const grams = [];
  for (let i = 0; i + k <= tokens.length; i++) grams.push(hashGram(tokens, i, k));
  if (grams.length <= w) {
    prints.add(Math.min(...grams).toString(36));
    return { tokenCount: tokens.length, prints };
  }
  for (let i = 0; i + w <= grams.length; i++) {
    let min = grams[i];
    for (let j = 1; j < w; j++) if (grams[i + j] < min) min = grams[i + j];
    prints.add(min.toString(36));
  }
  return { tokenCount: tokens.length, prints };
}

// Files are concatenated in a stable order so the fingerprint does not depend on
// how the host filesystem happened to enumerate them.
export function fingerprintFiles(files = []) {
  const sorted = [...files].filter(file => file && typeof file.content === 'string')
    .sort((a, b) => String(a.path).localeCompare(String(b.path)));
  const prints = new Set();
  let tokenCount = 0;
  for (const file of sorted) {
    const result = codeFingerprint(file.content);
    tokenCount += result.tokenCount;
    for (const print of result.prints) prints.add(print);
  }
  return { tokenCount, prints, fileCount: sorted.length };
}
