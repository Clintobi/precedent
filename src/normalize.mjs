import crypto from 'node:crypto';

// Ported verbatim in behaviour from the TxODDS judging pipeline
// (scripts/analyze-and-report.mjs normalizeReadme) so that anything the old
// exact-match pass flagged still gets flagged here.
export function normalizeText(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' URL ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function extractUrls(text) {
  const found = String(text ?? '').match(/https?:\/\/[^\s)>\]"'`]+/g) || [];
  return [...new Set(found.map(url => url.replace(/[.,;]+$/, '')))];
}

// Two submissions pointing at the same deployment are the strongest cheap
// signal there is, but only if the URLs are compared after normalization:
// trailing slashes and www prefixes otherwise hide the collision.
export function canonicalUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(String(url).trim());
    const host = parsed.host.toLowerCase().replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${host}${path}`.toLowerCase();
  } catch {
    return String(url).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '') || null;
  }
}

// Public infrastructure and listing pages are not deployments. The TxODDS run
// flagged five unrelated projects for "sharing" https://api.devnet.solana.com,
// which is every Solana devnet client's RPC endpoint and evidence of nothing.
const HOST_NOISE = /github\.com|gitlab\.com|discord\.|t\.me|youtube\.com|youtu\.be|loom\.com|vimeo\.com|x\.com|twitter\.com|localhost|127\.0\.0\.1|api\.devnet\.solana\.com|api\.mainnet-beta\.solana\.com|api\.testnet\.solana\.com|rpc\.ankr\.com|helius-rpc\.com|quiknode\.pro|superteam\.fun|earn\.superteam\.fun|npmjs\.com|docs\.solana\.com|solana\.com/i;

export function chooseDeployment(urls, homepage) {
  const candidates = [homepage, ...urls].filter(Boolean).filter(url => !HOST_NOISE.test(url));
  return candidates.find(url => /vercel\.app|netlify\.app|pages\.dev|onrender\.com|railway\.app|fly\.dev|\.app\b|\.xyz\b/i.test(url)) || candidates[0] || null;
}

export function chooseDemo(urls) {
  return (urls || []).find(url => /youtube\.com|youtu\.be|loom\.com|vimeo\.com/i.test(url)) || null;
}

// On-chain wallets and program ids that show up in more than one submission are
// worth surfacing: shared deployer means shared origin more often than not.
export function extractAddresses(text) {
  const body = String(text ?? '');
  const evm = body.match(/\b0x[a-fA-F0-9]{40}\b/g) || [];
  const base58 = (body.match(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g) || []).filter(candidate => /[A-Z]/.test(candidate) && /[a-z]/.test(candidate) && /[0-9]/.test(candidate));
  return [...new Set([...evm.map(a => a.toLowerCase()), ...base58])];
}
