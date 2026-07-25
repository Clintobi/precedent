// MinHash + LSH banding. Deterministic on purpose: the whole product rests on
// attesting a fingerprint on-chain, so the same input has to produce the same
// signature on any machine, forever. No Math.random anywhere in here.

export const NUM_HASHES = 128;
export const BANDS = 32;              // 32 bands x 4 rows => catches pairs from
export const ROWS = NUM_HASHES / BANDS; // roughly 0.42 Jaccard upward

function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(0x9e3779b9);
const COEFF_A = new Uint32Array(NUM_HASHES);
const COEFF_B = new Uint32Array(NUM_HASHES);
for (let i = 0; i < NUM_HASHES; i++) {
  COEFF_A[i] = (Math.floor(random() * 0xfffffffe) + 1) | 1; // odd, so invertible
  COEFF_B[i] = Math.floor(random() * 0xffffffff) >>> 0;
}

// Word k-grams. Short texts (a one-line project description, say) would produce
// an empty set at k=5, so they fall back to smaller grams rather than silently
// comparing as "no overlap with anything".
export function shingles(normalizedText, k = 5) {
  const words = String(normalizedText ?? '').split(' ').filter(Boolean);
  if (words.length === 0) return new Set();
  const size = words.length < k ? Math.max(1, Math.min(3, words.length)) : k;
  const out = new Set();
  for (let i = 0; i + size <= words.length; i++) out.add(words.slice(i, i + size).join(' '));
  return out;
}

export function signature(shingleSet) {
  const sig = new Uint32Array(NUM_HASHES).fill(0xffffffff);
  if (!shingleSet || shingleSet.size === 0) return sig;
  for (const shingle of shingleSet) {
    const base = fnv1a(shingle);
    for (let i = 0; i < NUM_HASHES; i++) {
      const value = (Math.imul(COEFF_A[i], base) + COEFF_B[i]) >>> 0;
      if (value < sig[i]) sig[i] = value;
    }
  }
  return sig;
}

export function estimateJaccard(sigA, sigB) {
  if (!sigA || !sigB) return 0;
  let matches = 0;
  for (let i = 0; i < NUM_HASHES; i++) if (sigA[i] === sigB[i]) matches++;
  return matches / NUM_HASHES;
}

export function exactJaccard(setA, setB) {
  if (!setA?.size || !setB?.size) return 0;
  let intersection = 0;
  const [small, large] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  for (const item of small) if (large.has(item)) intersection++;
  return intersection / (setA.size + setB.size - intersection);
}

// Band keys for blocking. Comparing 654 submissions pairwise is 213k
// comparisons, which is fine, but an event with 10k entries is 50M and this is
// what keeps that linear-ish.
export function bandKeys(sig) {
  const keys = [];
  for (let band = 0; band < BANDS; band++) {
    let acc = 0x811c9dc5;
    for (let row = 0; row < ROWS; row++) {
      const value = sig[band * ROWS + row];
      acc ^= value;
      acc = Math.imul(acc, 0x01000193);
    }
    keys.push(`${band}:${(acc >>> 0).toString(36)}`);
  }
  return keys;
}
