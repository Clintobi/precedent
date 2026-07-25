#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { analyze } from '../src/engine.mjs';
import { toMarkdown } from '../src/report.mjs';
import { loadTxodds } from '../adapters/txodds.mjs';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) { args[key] = true; continue; }
    args[key] = next;
    i++;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (args.help || (!args.input && !args.txodds)) {
  console.log(`precedent — submission originality check

  --input <file.json>     array of { id, title, text, repo, deploymentUrl, demoUrl, files:[{path,content}] }
  --txodds <manifest.json> read the TxODDS judging manifest instead
  --out <dir>             write report.md, report.json and attestations.json (default: ./out)
  --near <0-1>            near-duplicate text threshold (default 0.5)
  --code <0-1>            code clone threshold (default 0.6)
`);
  process.exit(args.help ? 0 : 1);
}

const submissions = args.txodds ? loadTxodds(args.txodds) : JSON.parse(fs.readFileSync(args.input, 'utf8'));
if (!Array.isArray(submissions)) {
  console.error('input must be a JSON array of submissions');
  process.exit(1);
}

const options = {};
if (args.near) options.nearTextThreshold = Number(args.near);
if (args.code) options.codeCloneThreshold = Number(args.code);

const started = Date.now();
const result = analyze(submissions, options);
const elapsed = Date.now() - started;

const titles = new Map(submissions.map(submission => [String(submission.id), submission.title]));
const outDir = args.out === true || !args.out ? 'out' : args.out;
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(result, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'report.md'), toMarkdown(result, titles));
fs.writeFileSync(path.join(outDir, 'attestations.json'), JSON.stringify(result.attestations, null, 2) + '\n');

const { counts } = result;
console.log(`${counts.submissions} submissions in ${elapsed}ms — ${counts.candidatePairs} pairs compared, ${counts.flaggedPairs} flagged`);
console.log(`  exact ${counts.exact} · near ${counts.near} · shared artifact ${counts.sharedArtifact} · partial ${counts.weak}`);
console.log(`  wrote ${path.join(outDir, 'report.md')}`);
