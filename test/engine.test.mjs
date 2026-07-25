import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, prepare } from '../src/engine.mjs';
import { tokenizeCode } from '../src/code.mjs';

const README = `Fulltime is a prediction market for football matches settled by an on-chain oracle.
A fan deposits USDC into a market for a fixture, the feed publishes the final score after the whistle,
and the settlement program pays out every winning position without an operator touching the funds.
The proof ticket is the interesting part: every settled position emits a receipt a fan can verify
independently, so nobody has to trust our backend to have paid correctly. Deposits are gasless.
Markets close at kickoff and resolve within two minutes of full time.`;

const COPIED = README.replaceAll('Fulltime', 'Kickoff Markets') + '\nWe also plan a mobile client later this year.';

const ORIGINAL_CODE = `
export function settleMarket(marketAccount, finalScore, oracleSignature) {
  const positions = marketAccount.positions.filter(position => position.active);
  if (!verifyOracle(oracleSignature, finalScore)) {
    throw new Error('bad oracle signature');
  }
  let totalWinning = 0;
  for (const position of positions) {
    if (position.prediction === finalScore.outcome) {
      totalWinning += position.stake;
    }
  }
  for (const position of positions) {
    if (position.prediction === finalScore.outcome) {
      const share = position.stake / totalWinning;
      position.payout = share * marketAccount.pool;
      position.active = false;
    }
  }
  return { settled: true, pool: marketAccount.pool, winners: positions.length };
}
`;

// Same program, every identifier renamed, comments added, spacing changed.
const RENAMED_CODE = `
// resolve a market once the feed reports
export function resolveBook(bookAcct, result, sig) {
  const entries = bookAcct.entries.filter(entry => entry.live);

  if (!checkFeed(sig, result)) {
    throw new Error('invalid feed signature');
  }

  let winningTotal = 0;
  for (const entry of entries) {
    if (entry.guess === result.winner) {
      winningTotal += entry.amount;
    }
  }
  for (const entry of entries) {
    if (entry.guess === result.winner) {
      const portion = entry.amount / winningTotal;
      entry.payment = portion * bookAcct.prize;
      entry.live = false;
    }
  }
  return { resolved: true, prize: bookAcct.prize, winners: entries.length };
}
`;

const UNRELATED = `RugRadar scores a Solana token before you buy it. It reads mint and freeze authority,
checks whether liquidity is burned, clusters holders by their funding wallet and returns a single number
between zero and one hundred with the reasons attached. There is no wallet connection and no trading.`;

test('identical normalized text is flagged exact', () => {
  const result = analyze([
    { id: 'a', title: 'Fulltime', text: README },
    { id: 'b', title: 'Fulltime Copy', text: README }
  ]);
  const pair = result.pairs.find(item => item.left === 'a' && item.right === 'b');
  assert.ok(pair, 'expected a flagged pair');
  assert.equal(pair.verdict, 'exact');
  assert.ok(pair.flags.includes('EXACT_NORMALIZED_TEXT'));
});

test('renamed copy with an added sentence is near, not exact', () => {
  const result = analyze([
    { id: 'a', title: 'Fulltime', text: README },
    { id: 'b', title: 'Kickoff Markets', text: COPIED }
  ]);
  const pair = result.pairs.find(item => item.left === 'a' && item.right === 'b');
  assert.ok(pair, 'a lexical copy with the product name swapped must still be caught');
  assert.equal(pair.verdict, 'near');
  assert.ok(!pair.flags.includes('EXACT_NORMALIZED_TEXT'));
  assert.ok(pair.textSimilarity >= 0.5, `text similarity was ${pair.textSimilarity}`);
});

test('code clone survives renaming every identifier', () => {
  const result = analyze([
    { id: 'a', title: 'Fulltime', text: README, files: [{ path: 'src/settle.js', content: ORIGINAL_CODE }] },
    { id: 'b', title: 'Something Else', text: UNRELATED, files: [{ path: 'lib/resolve.js', content: RENAMED_CODE }] }
  ]);
  const pair = result.pairs.find(item => (item.left === 'a' && item.right === 'b') || (item.left === 'b' && item.right === 'a'));
  assert.ok(pair, 'clones with unrelated descriptions must still be compared on code');
  assert.ok(pair.flags.includes('CODE_CLONE'), `flags were ${pair.flags.join(',')}`);
  assert.ok(pair.codeSimilarity >= 0.6, `code similarity was ${pair.codeSimilarity}`);
});

test('unrelated submissions produce no pair', () => {
  const result = analyze([
    { id: 'a', title: 'Fulltime', text: README },
    { id: 'b', title: 'RugRadar', text: UNRELATED }
  ]);
  assert.equal(result.pairs.length, 0);
});

test('shared deployment url is caught even when the text differs', () => {
  const result = analyze([
    { id: 'a', title: 'One', text: README, deploymentUrl: 'https://www.demo-app.vercel.app/' },
    { id: 'b', title: 'Two', text: UNRELATED, deploymentUrl: 'https://demo-app.vercel.app' }
  ]);
  const pair = result.pairs[0];
  assert.ok(pair, 'expected the URL collision to surface');
  assert.equal(pair.verdict, 'shared-artifact');
  assert.ok(pair.flags.includes('SHARED_DEPLOYMENT_URL'));
});

test('identifier stripping actually happens', () => {
  const tokens = tokenizeCode('const someVeryLongName = 42;');
  assert.deepEqual(tokens, ['const', 'V', '=', 'N', ';']);
});

test('attestation hash is deterministic and content-derived', () => {
  const first = prepare({ id: 'x', title: 'T', text: README, files: [{ path: 'a.js', content: ORIGINAL_CODE }] });
  const second = prepare({ id: 'different-id', title: 'T', text: README, files: [{ path: 'a.js', content: ORIGINAL_CODE }] });
  const changed = prepare({ id: 'x', title: 'T', text: README + ' one more clause', files: [{ path: 'a.js', content: ORIGINAL_CODE }] });
  assert.equal(first.attestationHash, second.attestationHash, 'same content must attest to the same hash');
  assert.notEqual(first.attestationHash, changed.attestationHash);
  assert.match(first.attestationHash, /^[0-9a-f]{64}$/);
});
