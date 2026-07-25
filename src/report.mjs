const LABELS = {
  exact: 'Exact duplicates',
  near: 'Near duplicates',
  'shared-artifact': 'Shared artifacts (same deployment, demo, repo or fork)',
  weak: 'Partial overlap (review, do not act on alone)'
};

export function toMarkdown(result, titles = new Map()) {
  const name = id => (titles.get(id) ? `${id} (${titles.get(id)})` : id);
  const groups = ['exact', 'near', 'shared-artifact', 'weak'];
  const lines = [];

  lines.push('# Originality report');
  lines.push('');
  lines.push(`Generated ${result.generatedUtc}. ${result.counts.submissions} submissions, ${result.counts.withText} with enough text to compare, ${result.counts.withCode} with code. ${result.counts.candidatePairs} pairs compared, ${result.counts.flaggedPairs} flagged.`);
  lines.push('');
  lines.push(`**${result.counts.insufficientText} submissions carried fewer than ${result.config.minBodyWords} words of description and were not judged on text at all.** That is a coverage gap in the input, not a clean bill of health for them.`);
  lines.push('');
  lines.push('Nothing here is a disqualification. Every line is evidence for a human to act on, and a flagged pair can have an innocent explanation (a shared template, a team submitting to two tracks, a monorepo).');
  lines.push('');
  lines.push(`| Verdict | Pairs |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Exact | ${result.counts.exact} |`);
  lines.push(`| Near | ${result.counts.near} |`);
  lines.push(`| Shared artifact | ${result.counts.sharedArtifact} |`);
  lines.push(`| Partial | ${result.counts.weak} |`);

  for (const group of groups) {
    const pairs = result.pairs.filter(pair => pair.verdict === group);
    lines.push('');
    lines.push(`## ${LABELS[group]} (${pairs.length})`);
    if (!pairs.length) { lines.push(''); lines.push('_None._'); continue; }
    lines.push('');
    for (const pair of pairs) {
      const text = pair.textSimilarity === null ? 'text not compared (too little text)' : `text ${(pair.textSimilarity * 100).toFixed(1)}%`;
      const code = pair.codeSimilarity ? `, code ${(pair.codeSimilarity * 100).toFixed(1)}%` : '';
      lines.push(`- **${name(pair.left)}** ↔ **${name(pair.right)}**: ${text}${code}`);
      lines.push(`  - flags: \`${pair.flags.join('`, `')}\``);
      for (const item of pair.evidence) lines.push(`  - ${item}`);
    }
  }

  lines.push('');
  lines.push('## Limits');
  lines.push('');
  lines.push('- Text matching is lexical (5-word shingles). A full semantic rewrite that keeps the idea and changes every phrase will not trip it.');
  lines.push('- Code fingerprints only exist for submissions whose files were supplied; text-only entries are compared on text alone.');
  lines.push('- Timestamps from git history are weak evidence and can be manipulated. Attested hashes are not.');
  return lines.join('\n') + '\n';
}
