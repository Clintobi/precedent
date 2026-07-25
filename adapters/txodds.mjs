import fs from 'node:fs';

// Adapter for the TxODDS x Solana World Cup judging manifest, which is the real
// 653-record set Precedent was built out of. Repository clones are long gone, so
// this feeds text and artifact URLs only; code fingerprints stay empty for it.
export function loadTxodds(manifestPath) {
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const records = raw.records || [];
  return records.map(record => ({
    id: record.candidate_id,
    title: record.project || record.canonical_repository || record.candidate_id,
    text: [record.written_description, (record.claimed_txline_endpoints || []).join(' '), (record.topics || []).join(' ')].filter(Boolean).join('\n'),
    repo: record.canonical_repository || record.github_url,
    homepage: null,
    deploymentUrl: record.deployment_url,
    demoUrl: record.demo_video_url,
    forkParent: record.fork ? record.fork_parent : null,
    files: []
  }));
}
