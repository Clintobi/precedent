# Precedent — Agentic Engineering Grant (Superteam Earn)

Submit at: https://superteam.fun/earn/grants/agentic-engineering
Repo: https://github.com/Clintobi/precedent (private; the listing requires sharing access with abhwshek@gmail.com if it stays private)
Devnet program: `4v3eUeqjyyGq26qypp8jBEpTuHSYYP1tqB1H3DuwX4zc`
Grant: 200 USDG fixed. 50% upfront post-KYC (processed Mondays, paid by Friday), 50% on ship.

---

# Step 1: Basics

**Project Title**
> Precedent

**One Line Description**
> Precedent checks a batch of submissions for duplicates and recycled work, and attests each one's hash on Solana so a builder can prove they were first.

**TG username**
> buchi0x

**Wallet Address**
> [YOUR SOLANA ADDRESS — use the Earn auto-fill link, or paste your own Phantom/Solflare address. Not an 0x address.]

---

# Step 2: Details

**Project Details**
> The problem: submission review has stopped scaling. curl suspended its paid bug bounty in January after an explosion of AI-generated reports, Nextcloud paused its programme in April for the same reason, and Bugcrowd's submission volume more than quadrupled inside three weeks in March. Hackathons have the same problem with less press. I hit it directly last month running the judging pipeline for the TxODDS × Solana World Cup hackathon: 653 submissions, and the copies only surfaced because I wrote scripts to find them. Most organizers are doing that triage by hand, and when two people claim the same work, it comes down to whoever the platform believes.
>
> The solution is Precedent. You point it at a set of submissions, whether those are hackathon projects, bounty writeups or grant applications, and it returns which entries duplicate each other with the evidence behind every call. Text matching uses 5-word shingles with MinHash signatures and LSH blocking, so a copied README with the product name swapped still gets caught. Code fingerprints strip comments and literals and collapse identifiers, so renaming every variable in a fork doesn't hide it. It also catches shared deployment URLs, shared repositories, shared on-chain addresses, declared forks and identical project names. It reports evidence and never verdicts, because a person should make the call.
>
> Solana is the registry, and that's the part a database can't replace. Every checked submission gets its content hash attested on-chain with a timestamp, and the hash is the PDA seed, so a second attestation of the same hash is rejected by the program itself and the first writer keeps priority. "Who submitted this first" becomes verifiable by anyone without trusting my server. And because the registry is public, an event in October can check its entries against submissions attested at a different platform's event in August, which no organizer's private database can do. The attested hash covers normalized text and code structure only, so a private repo can be attested without disclosing a line of it.
>
> Organizers and sponsors pay per batch in USDC. The engine and the devnet program already run. The grant month covers mainnet, the hosted app, payment, and one real originality report published on a real event.

**Deadline** (Africa/Lagos)
> Friday, 4 September 2026

**Proof of Work**
> Precedent already runs. Repo: github.com/Clintobi/precedent (private for now, happy to share access). The attestation program is deployed to Solana devnet at 4v3eUeqjyyGq26qypp8jBEpTuHSYYP1tqB1H3DuwX4zc. I've attested a real submission hash on it (tx 26QJy9ZoJKBWqQYNxHGAN8KeUxWWjjD6ktQJN3abfW4fp2jecYo1MACXzobRdFsbTNjzCdijumfLvAggC43EPNQc), then tried to attest the same hash again and watched the program reject it. The detection engine scores 653 real submissions in 91 milliseconds with 7 tests passing, and there's a web app that takes a pasted submission set and returns the flagged pairs with evidence.
>
> What it grew out of: I built the judging pipeline for the TxODDS × Solana World Cup hackathon. 653 submissions, every repository cloned and snapshotted, eligibility checked, scored 0 to 5 against each published criterion with confidence levels, blind review, and duplicate flags for identical normalized READMEs and shared demo or deployment URLs.
>
> I also submitted to that hackathon across three tracks, all built solo: Fulltime, a prediction market with on-chain settlement; EdgeBot, a trading agent with a pre-trade policy gate; and Fan Zone, a provably fair sweepstake.
>
> One thing worth saying plainly, since it's the actual work: the first version of Precedent's engine produced confident false positives. Three unrelated Replit exports hashed identically because each description was "Repository for <url>" and normalization collapses URLs. I only caught that by running it against 653 real records instead of my own fixtures, and it now refuses to judge any submission under 12 words rather than guessing, and reports how many it skipped.

**Personal X Profile**
> 0xbuchi

**Personal GitHub Profile**
> Clintobi

**Colosseum Crowdedness Score**
> Highest similarity across the whole Colosseum corpus of 5,400+ hackathon projects: **0.090** (Chronotrace, which does duplicate detection for digital assets before minting, so NFT assets rather than submissions). Copilot's own guidance puts a strong match above 0.4 and "worth reading" at 0.2 to 0.4, so nothing in the corpus reaches either bar. Three separate query phrasings were run and the nearest neighbour was the same project each time. Screenshot: `colosseum-crowdedness.jpg`, page source `colosseum-crowdedness.html`.
>
> [PASTE YOUR PUBLIC GOOGLE DRIVE LINK TO colosseum-crowdedness.jpg HERE]

**AI Session Transcript**
> `claude-session.jsonl` in the project root. READ THE PRIVACY NOTE BELOW BEFORE UPLOADING.

---

# Step 3: Milestones

**Goals and Milestones**
> **M1 — engine and devnet (done, 25 July).** Near-duplicate detection over a submission set: 5-word shingles with MinHash and LSH blocking, winnowed code fingerprints that survive renaming every identifier, and collision flags for deployment URL, demo URL, repository, on-chain address, fork and project name. Verified against a real 653-submission set in 91ms, 7 tests passing. Anchor attestation program live on devnet, content hash as the PDA seed, duplicate attestations rejected on-chain.
>
> **M2 — hosted app and mainnet (by 14 August).** The check API and report UI deployed at a public URL. Attestation program on mainnet. Batch attestation, so an organizer attests a whole event in one run.
>
> **M3 — payment and first real event (by 25 August).** USDC per batch. Precedent run against a live event's real submission set, with the report handed to that event's organizer.
>
> **M4 — published report and ship (by 4 September).** One public originality report on a real event, demo video, and the tranche-2 submission with the live URL, repo and subscription receipts.

**Primary KPI**
> Submissions checked and attested on mainnet: 1,500 across at least two real events by 4 September.

**Final tranche checklist**
> Colosseum project link, GitHub repo, and the AI coding subscription receipts totalling $200.

---

# Before you submit

1. **Wallet address** into Step 1.
2. **Colosseum Crowdedness Score** — the one field nothing else can produce for you. https://colosseum.com/copilot, screenshot, public Drive link.
3. **Repo access** — either share github.com/Clintobi/precedent with abhwshek@gmail.com, or run `gh repo edit Clintobi/precedent --visibility public`.
4. **Transcript** — decide which version to upload (below).

## Privacy note on the session transcript

`export-session.sh` exported two files into the project root:

- `claude-session.jsonl` — 3.4MB, 776 entries. This is the whole session, and it contains a great deal that has nothing to do with Precedent: your memory index naming every other project (VNSIS, cold email, RecruitQuota, StudyStack, EKSUMSA, med school), your email addresses, the path to your devnet deployer keypair, the Reddit research, and the memecoin trading video. Uploading it hands a grant reviewer all of that.
- `codex-session.jsonl` — a Codex session from **20 July**, unrelated to this project entirely. The export script grabs the latest Codex session regardless of what it was about. Don't upload this one without opening it first.

Both are in `.gitignore`, so they will not reach GitHub.

Options, fastest first: upload as-is and accept the exposure; upload a trimmed transcript covering only the Precedent build; or start a fresh session inside `~/Projects/precedent`, re-run the grant skill there, and upload that clean transcript instead.
