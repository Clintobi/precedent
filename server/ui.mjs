// No build step, no CDN, no framework. One file of HTML so the whole thing
// stays runnable with `node server/index.mjs` on any machine.
export function page() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Precedent — submission originality check</title>
<style>
  :root { color-scheme: light dark; --bg:#fbfbfa; --fg:#16150f; --muted:#6b6a62; --line:#e2e1da; --card:#fff; --accent:#3b2fd6; }
  @media (prefers-color-scheme: dark) { :root { --bg:#12120f; --fg:#f2f1ea; --muted:#9b9a90; --line:#2c2b25; --card:#1a1a16; --accent:#a9a2ff; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.55 ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif; }
  .wrap { max-width: 940px; margin: 0 auto; padding: 40px 24px 80px; }
  h1 { font-size: 26px; margin: 0 0 6px; letter-spacing: -0.02em; }
  .sub { color: var(--muted); margin: 0 0 28px; }
  textarea { width:100%; min-height: 240px; padding:14px; border:1px solid var(--line); border-radius:10px; background:var(--card); color:var(--fg); font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; resize:vertical; }
  .row { display:flex; gap:10px; align-items:center; margin:14px 0 0; flex-wrap:wrap; }
  button { border:0; border-radius:8px; padding:10px 16px; font-weight:600; font-size:14px; cursor:pointer; background:var(--accent); color:#fff; }
  button.ghost { background:transparent; color:var(--accent); border:1px solid var(--line); }
  button:disabled { opacity:.55; cursor:progress; }
  .counts { display:flex; gap:10px; flex-wrap:wrap; margin:24px 0 8px; }
  .tile { flex:1 1 130px; border:1px solid var(--line); border-radius:10px; padding:12px 14px; background:var(--card); }
  .tile b { display:block; font-size:22px; letter-spacing:-0.02em; }
  .tile span { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.06em; }
  .note { border-left:3px solid var(--accent); padding:10px 14px; background:var(--card); border-radius:0 8px 8px 0; margin:18px 0; color:var(--muted); }
  .pair { border:1px solid var(--line); border-radius:10px; padding:14px 16px; background:var(--card); margin:10px 0; }
  .pair h3 { margin:0 0 6px; font-size:15px; }
  .verdict { display:inline-block; font-size:11px; text-transform:uppercase; letter-spacing:.07em; padding:2px 8px; border-radius:99px; border:1px solid var(--line); color:var(--muted); margin-right:8px; }
  .verdict.exact { background:#c0392b; color:#fff; border-color:transparent; }
  .verdict.near { background:#c77b12; color:#fff; border-color:transparent; }
  ul { margin:8px 0 0; padding-left:18px; color:var(--muted); font-size:13px; }
  code { font:12px ui-monospace,Menlo,monospace; background:var(--bg); padding:1px 5px; border-radius:4px; border:1px solid var(--line); }
  .err { color:#c0392b; }
  h2 { font-size:16px; margin:26px 0 4px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Precedent</h1>
  <p class="sub">Paste a submission set. Get back which entries duplicate each other, and the evidence for each call.</p>

  <textarea id="input" spellcheck="false" placeholder='[{"id":"s1","title":"Project","text":"description or README","repo":"https://github.com/x/y","deploymentUrl":"https://x.vercel.app"}]'></textarea>

  <div class="row">
    <button id="run">Check submissions</button>
    <button id="sample" class="ghost">Load a sample</button>
    <span id="status" class="sub" style="margin:0"></span>
  </div>

  <div id="out"></div>
</div>
<script>
const $ = id => document.getElementById(id);
const SAMPLE = [
  { id: 's1', title: 'Fulltime', text: 'Fulltime is a prediction market for football matches settled by an on-chain oracle. A fan deposits USDC into a market for a fixture, the feed publishes the final score after the whistle, and the settlement program pays every winning position without an operator touching the funds.', repo: 'https://github.com/clintobi/fulltime', deploymentUrl: 'https://fulltime.vercel.app' },
  { id: 's2', title: 'Kickoff Markets', text: 'Kickoff Markets is a prediction market for football matches settled by an on-chain oracle. A fan deposits USDC into a market for a fixture, the feed publishes the final score after the whistle, and the settlement program pays every winning position without an operator touching the funds. We also plan a mobile client.', repo: 'https://github.com/someone/kickoff' },
  { id: 's3', title: 'RugRadar', text: 'RugRadar scores a Solana token before you buy it. It reads mint and freeze authority, checks whether liquidity is burned, clusters holders by funding wallet and returns a score with reasons attached.', repo: 'https://github.com/clintobi/rugradar', deploymentUrl: 'https://fulltime.vercel.app' }
];

$('sample').onclick = () => { $('input').value = JSON.stringify(SAMPLE, null, 2); };

$('run').onclick = async () => {
  const button = $('run');
  let submissions;
  try { submissions = JSON.parse($('input').value); }
  catch (error) { $('out').innerHTML = '<p class="err">That is not valid JSON: ' + error.message + '</p>'; return; }

  button.disabled = true; $('status').textContent = 'checking...';
  try {
    const response = await fetch('/api/check', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ submissions }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'check failed');
    render(result, submissions);
    $('status').textContent = '';
  } catch (error) {
    $('out').innerHTML = '<p class="err">' + error.message + '</p>';
    $('status').textContent = '';
  } finally { button.disabled = false; }
};

function escapeHtml(value) { return String(value).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }

function render(result, submissions) {
  const titles = new Map(submissions.map(s => [String(s.id), s.title || s.id]));
  const c = result.counts;
  const tile = (label, value) => '<div class="tile"><b>' + value + '</b><span>' + label + '</span></div>';
  let html = '<div class="counts">' + tile('submissions', c.submissions) + tile('pairs compared', c.candidatePairs) + tile('exact', c.exact) + tile('near', c.near) + tile('shared artifact', c.sharedArtifact) + '</div>';

  if (c.insufficientText) {
    html += '<div class="note">' + c.insufficientText + ' of ' + c.submissions + ' submissions had fewer than ' + result.config.minBodyWords + ' words of text and were not judged on text at all. That is a gap in the input, not a clean result for them.</div>';
  }
  html += '<div class="note">Nothing here is a disqualification. Every line is evidence for a person to act on, and a flagged pair can have an innocent explanation.</div>';

  if (!result.pairs.length) { html += '<h2>No pairs flagged</h2>'; $('out').innerHTML = html; return; }

  html += '<h2>' + result.pairs.length + ' flagged pair' + (result.pairs.length === 1 ? '' : 's') + '</h2>';
  for (const pair of result.pairs) {
    const text = pair.textSimilarity === null ? 'text not compared' : 'text ' + (pair.textSimilarity * 100).toFixed(1) + '%';
    const code = pair.codeSimilarity ? ' · code ' + (pair.codeSimilarity * 100).toFixed(1) + '%' : '';
    html += '<div class="pair"><h3><span class="verdict ' + pair.verdict + '">' + pair.verdict + '</span>' +
      escapeHtml(titles.get(pair.left) || pair.left) + ' ↔ ' + escapeHtml(titles.get(pair.right) || pair.right) + '</h3>' +
      '<div class="sub" style="margin:0">' + text + code + '</div>' +
      '<ul>' + pair.evidence.map(e => '<li>' + escapeHtml(e) + '</li>').join('') +
      '<li>flags: <code>' + pair.flags.join('</code> <code>') + '</code></li></ul></div>';
  }
  $('out').innerHTML = html;
}
</script>
</body>
</html>`;
}
