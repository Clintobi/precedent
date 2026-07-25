# Precedent — Superteam Agentic Engineering grant

Repo: https://github.com/Clintobi/precedent (private — the listing requires sharing access with abhwshek@gmail.com if it stays private)
Devnet program: `4v3eUeqjyyGq26qypp8jBEpTuHSYYP1tqB1H3DuwX4zc`

Grant: https://superteam.fun/earn/grants/agentic-engineering/ (rolling, $200 USDG, 50% upfront post-KYC, 50% on ship, ~1 week response)
Contact for code access if repo stays private: abhwshek@gmail.com
Status: verified open 2026-07-25. 251 recipients, $50.2k approved.

---

## What it is

A submission originality checker with an on-chain attestation registry.

One engine, several surfaces. Point it at a set of submissions and it tells you which ones are near-duplicates of each other, which recycle a previous event's work, and what the evidence is. Surfaces, in order of build:

1. **Hackathon / project submissions** (grant-month MVP). The corpus is the submission set itself, so there is no third-party data licensing and no cold start.
2. **Bug bounty / audit findings** (next). Needs a corpus of published findings; see risks.
3. **Grant applications** (later, and it is the same engine).

### Why Solana is the mechanism, not decoration

At check time, the artifact's content hash (repo tree hash + writeup hash) is attested on-chain with a timestamp. Two consequences:

- **Provable priority.** "I submitted this at 14:03 UTC on Aug 3" becomes verifiable by anyone without trusting the platform. That is the exact fight in every duplicate dispute in bug bounties, and in hackathon plagiarism accusations.
- **A cross-platform dedupe index.** Because attestations are public and permissionless, an October hackathon can check its entries against everything attested before it, including submissions made on a different platform. No single organizer's private DB can do that. A shared public registry can, and every write makes the next check better.

Revenue: sponsors and organizers pay per batch in USDC. Attestation cost is a rounding error.

## The asset this is built on

`~/Projects/txodds/judging/txodds-world-cup-judging` — the judging pipeline for the TxODDS × Solana World Cup hackathon. 654 submissions in `data/submissions-manifest.csv`, repo cloning and snapshotting, eligibility checks, 0–5 per-criterion scoring with confidence levels, blind review, plus the two flags that did most of the plagiarism work: `EXACT_NORMALIZED_README` and `SHARED_DEMO_OR_DEPLOYMENT_URL`.

That is throwaway scripting for one event. Precedent is that pipeline as a product.

## Demand evidence (verified 2026-07-25)

- curl suspended its paid bug bounty in January 2026 over an "explosion in AI slop reports"
- Nextcloud paused its program in April 2026 citing low-quality report volume
- Bugcrowd's submission volume more than quadrupled in a three-week window in March 2026
  (https://www.computing.co.uk/news/2026/security/bug-bounty-platforms-battle-ai-slop, https://www.bugcrowd.com/blog/bugcrowd-policy-changes-to-address-ai-slop-submissions/)

Human-validation systems are breaking under generated volume. Hackathons are the same shape of problem with less press.

## Architecture

**Fingerprint per submission**
- normalized text embedding of README / writeup (catches paraphrase, which plain string matching misses)
- code structure hash (function-level / AST-shaped) so a renamed fork still matches
- external collision signals: shared demo or deployment URL, shared deployer wallet, identical dependency fingerprints
- git-history heuristics: single-commit dumps, timestamps clustered at the deadline

**Compare against**
- every other submission in the same set
- the on-chain attestation registry (prior events, any platform)
- (surface 2) a corpus of published audit findings

**Output**: originality report, matched pairs with similarity scores and the evidence for each call. Not a verdict, evidence an organizer can act on.

**On-chain**: small Anchor program storing `(hash, timestamp, submitter, event_id)`. Check first whether an existing Solana attestation primitive fits before writing one; do not build what already exists.

## Grant-month plan

**Week 1** — Port the dedup engine out of the judging repo into a standalone service. Settle the fingerprint. Anchor attestation program on devnet with tests.

**Week 2** — Check API plus report UI. Ingest one real public submission set and produce a genuine report on it.

**Week 3** — Attestation program to mainnet. USDC payment per batch. Second surface started (audit findings adapter over public Code4rena / Sherlock reports).

**Week 4** — Publish one real originality report on a real event. Demo video. Tranche-2 submission: live URL, repo, subscription receipts totalling $200.

Apply now, before any of this is built. The grant pays 50% upfront and response time is about a week; waiting to apply until the code exists wastes two weeks of runway.

---

# Paste-ready application copy

## Basics

**Project Title**
Precedent

**One Line Description**
Precedent checks a batch of submissions (hackathon projects, bounty reports, grant applications) for duplicates and recycled work, and writes a timestamped hash of each one to Solana so a builder can prove they were first.

**TG username**
buchi0x

**Wallet Address**
[YOUR SOLANA ADDRESS — Phantom/Solflare, not an 0x address. Double-check it; payouts go exactly where you point them.]

## Details — What do you want to build?

Precedent, a submission originality checker with an on-chain attestation registry on Solana.

Proof I can ship this fast: it already partly runs. The detection engine scores 653 real submissions in 91 milliseconds, and the attestation program is deployed to Solana devnet at `4v3eUeqjyyGq26qypp8jBEpTuHSYYP1tqB1H3DuwX4zc`, where a duplicate hash is already rejected on-chain. I built the first version of the engine under a deadline: I ran the judging pipeline for the TxODDS × Solana World Cup hackathon, 653 submissions, every repo cloned and snapshotted, scored against the rubric, copies flagged. Two flags did most of the work, identical normalized READMEs and submissions sharing a demo or deployment URL. I wrote it as throwaway scripts for one event, then realized every organizer running a hackathon or a bounty does that same triage by hand, and it's getting worse. curl suspended its paid bug bounty in January over AI-generated reports, Nextcloud paused theirs in April, and Bugcrowd's submission volume more than quadrupled inside three weeks in March.

Precedent turns that pipeline into a service. You point it at a set of submissions and it returns an originality report: which entries are near-duplicates of each other, which recycle a previous event's winner, which share deploy URLs or deployer wallets, and the evidence behind each call. It reports evidence, not verdicts; a human still decides.

The registry is the Solana part, and it's why this isn't a SaaS with a blockchain sticker on it. When a submission is checked, its content hash (repo tree plus writeup) is attested on-chain with a timestamp. A builder gets provable priority, so "I submitted this at 14:03 UTC on August 3" can be verified by anyone without trusting the platform, which is the fight at the centre of every duplicate dispute in bug bounties. And because those attestations are public and permissionless, a hackathon in October can check its entries against everything attested before it, including submissions from a competing platform. No single organizer's private database can offer that. A shared public registry can, and it gets sharper with every submission written into it.

There's a symmetry to this that I like: the flood is agent-generated, so the triage has to be agent-built. One person reading 654 repos by hand cannot keep pace with submissions written in seconds, and hiring reviewers doesn't scale either. Precedent is agents doing the reading, with a chain holding the receipts.

Scope for the grant month: the engine, the attestation program on mainnet, a web app where an organizer pastes a submission list and gets a report back, and one real report published on a real event. Organizers and sponsors pay per batch in USDC. The audit-findings corpus for the bounty side, built from public Code4rena and Sherlock reports, is the surface after that.

## Details — How will you use AI coding tools?

The $200 covers a month of Claude Code at its top tier, and two parts of this build are new territory for me.

The attestation program is Anchor and Rust, and I've written a lot more TypeScript than Rust, so I'll lean on the AI to write the program, its tests and the client, then read every line myself before anything touches mainnet. The second part is the similarity engine. My hackathon version was crude string normalization, and I want code-structure fingerprinting so a renamed fork still matches; that means a lot of iteration against real submission data, which is precisely what the AI is fast at and what would otherwise eat the whole month.

I already work this way. The 654-submission pipeline was built with the AI writing most of the scripts while I decided what to measure and what to trust. Subscription receipts totalling $200 go into the tranche-2 form.

## Milestones

**Milestone 1 (weeks 1–2): engine and devnet — already done**
Fingerprinting runs over a real 653-submission set in 91ms: 5-word shingles with MinHash and LSH blocking for near duplicates, winnowed code fingerprints that survive renaming every identifier, and collision signals for deployment URL, demo URL, repository, on-chain address, fork and project name. The Anchor attestation program is live on devnet at `4v3eUeqjyyGq26qypp8jBEpTuHSYYP1tqB1H3DuwX4zc` with the content hash as the PDA seed, so a second attestation of the same hash is rejected on-chain and the first writer keeps priority. 7 tests passing.

**Milestone 2 (week 3): live app and mainnet**
An organizer pastes a submission list and gets a report with per-pair evidence. Attestation program live on mainnet. USDC payment per batch.

**Milestone 3 (week 4): a real report**
One originality report published on a real event, plus the demo video, the repo, and the live URL for tranche 2.

---

## Risks I'm carrying (not for the form)

- **Audit-findings corpus rights.** Solodit's terms page 404s, so those rights are unverified. Do not build surface 2 on a corpus you don't have rights to; assemble from public Code4rena and Sherlock reports (no consolidated licensed dataset exists, so this is real work). Solodit's MCP is fine for dev-time search: 50k+ findings, Rust = 2,652, and its keyword search misses semantic matches, which is itself the argument for the product.
- **Buyers are seasonal.** Hackathon organizers run events in bursts. Bounty sponsors are steadier, which is why surface 2 matters for revenue even though surface 1 ships first.
- **Attestation primitive.** Check for an existing Solana attestation program before writing one.
- **Embedding cost** at 654-submission scale, per event.
