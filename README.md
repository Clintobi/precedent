# Precedent

Submission originality checking, with the content hash of every checked submission attested on Solana.

Point it at a set of submissions (hackathon projects, bounty writeups, grant applications) and it reports which entries are duplicates of each other, which recycle work, and what the evidence is. It reports evidence, never verdicts; a human decides.

## Status

Week 1 of the grant month. Working today:

- **Engine**: exact, near-duplicate and code-clone detection over a submission set, plus artifact collision signals. No dependencies beyond Node.
- **Attestation program**: live on Solana devnet at `4v3eUeqjyyGq26qypp8jBEpTuHSYYP1tqB1H3DuwX4zc`.

Not built yet: the web app, mainnet deployment, USDC payment per batch, and the audit-findings corpus for the bounty surface.

## Run it

```bash
node --test test/engine.test.mjs        # 7 tests
node bin/precedent.mjs --input submissions.json --out out
```

Input is a JSON array:

```json
[{ "id": "s1", "title": "Fulltime", "text": "README or description text",
   "repo": "https://github.com/you/repo", "deploymentUrl": "https://app.vercel.app",
   "files": [{ "path": "src/lib.rs", "content": "..." }] }]
```

Outputs `report.md`, `report.json` and `attestations.json` into the output directory.

### Against the real set it was built from

```bash
node bin/precedent.mjs --txodds ~/Projects/txodds/judging/txodds-world-cup-judging/data/submissions-manifest.json --out out
```

653 submissions, 54,360 pairs compared, 91ms. It finds 3 exact-duplicate pairs, 106 shared-artifact pairs, and reports that 423 of the 653 carried too little text to judge at all.

Two of the three exact pairs (`linesman-latest`/`linesman`, `worldcup-ai-companion`/`worldcup-ai-companion1`) were independently flagged by the original judging pipeline from README text. Precedent found them from the written descriptions instead, which is a different input reaching the same conclusion.

## How detection works

**Text.** Normalized to lowercase with URLs collapsed, then 5-word shingles, 128-hash MinHash signatures, and 32-band LSH for blocking. Exact matches are compared on the body hash alone, so copying a README and changing only the title still reads as exact rather than near.

**Code.** Comments and string literals stripped, identifiers collapsed to `V`, numbers to `N`, then winnowed 5-gram fingerprints. Renaming every variable and reformatting the file does not change the fingerprint, so a renamed fork still matches its parent.

**Artifacts.** Shared deployment URL, shared demo URL, shared repository, shared on-chain address, declared GitHub fork, identical project name. Public infrastructure hosts are excluded: the original pipeline flagged five unrelated projects for "sharing" `api.devnet.solana.com`, which every devnet client uses.

**Short submissions are not judged.** Under 12 words of body, no text verdict is issued and the submission is counted in the report instead. `"Repository for https://replit.com/..."` normalizes to `repository for URL` for every Replit export, which would otherwise produce confident nonsense.

## Attestation

One account per content hash, with the hash as the PDA seed. A second attempt to attest the same hash fails at account creation, so the first writer holds the only record.

```bash
node scripts/attest.mjs <sha256-hex> [event-id-hex]
```

The attested hash covers normalized text plus code-structure fingerprints, so a private repo can be attested without disclosing any of it.

Why on-chain rather than a table in Postgres: the timestamp is verifiable by anyone without trusting whoever ran the check, and because the registry is public, a later event can check its entries against submissions attested at a different platform's event. A private database can do neither.

## Limits

Text matching is lexical. A full semantic rewrite that keeps the idea and changes every phrase will not trip it, and that is the honest ceiling of this approach without embeddings. Code fingerprints only exist for submissions whose files are supplied. Git timestamps are weak evidence and can be manipulated; attested hashes cannot.
