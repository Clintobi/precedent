use anchor_lang::prelude::*;

declare_id!("4v3eUeqjyyGq26qypp8jBEpTuHSYYP1tqB1H3DuwX4zc");

/// Precedent attestation registry.
///
/// One account per content hash, and the hash itself is the PDA seed. That is
/// the whole trick: a second attempt to attest the same hash fails at account
/// creation, so the first writer holds the only record and "who submitted this
/// first" stops being an argument between a builder and a platform.
///
/// Nothing here stores the submission. The hash is derived from normalized text
/// plus code structure fingerprints, so a private repo can be attested without
/// disclosing a line of it.
#[program]
pub mod attestation {
    use super::*;

    pub fn attest(ctx: Context<Attest>, content_hash: [u8; 32], event_id: [u8; 32]) -> Result<()> {
        let clock = Clock::get()?;
        let record = &mut ctx.accounts.record;

        record.content_hash = content_hash;
        record.event_id = event_id;
        record.submitter = ctx.accounts.submitter.key();
        record.slot = clock.slot;
        record.unix_timestamp = clock.unix_timestamp;

        emit!(Attested {
            content_hash,
            event_id,
            submitter: record.submitter,
            slot: record.slot,
            unix_timestamp: record.unix_timestamp,
        });

        Ok(())
    }

    /// Proves a hash is already registered and returns who got there first.
    /// Deliberately read-only: verification must never be able to mutate the
    /// record it is checking.
    pub fn verify(ctx: Context<Verify>) -> Result<()> {
        let record = &ctx.accounts.record;
        msg!(
            "attested by {} at slot {} ({})",
            record.submitter,
            record.slot,
            record.unix_timestamp
        );
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(content_hash: [u8; 32])]
pub struct Attest<'info> {
    #[account(
        init,
        payer = submitter,
        space = 8 + AttestationRecord::LEN,
        seeds = [b"precedent", content_hash.as_ref()],
        bump
    )]
    pub record: Account<'info, AttestationRecord>,
    #[account(mut)]
    pub submitter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Verify<'info> {
    #[account(
        seeds = [b"precedent", record.content_hash.as_ref()],
        bump
    )]
    pub record: Account<'info, AttestationRecord>,
}

#[account]
pub struct AttestationRecord {
    pub content_hash: [u8; 32],
    pub event_id: [u8; 32],
    pub submitter: Pubkey,
    pub slot: u64,
    pub unix_timestamp: i64,
}

impl AttestationRecord {
    pub const LEN: usize = 32 + 32 + 32 + 8 + 8;
}

#[event]
pub struct Attested {
    pub content_hash: [u8; 32],
    pub event_id: [u8; 32],
    pub submitter: Pubkey,
    pub slot: u64,
    pub unix_timestamp: i64,
}

#[error_code]
pub enum AttestationError {
    #[msg("this content hash is already attested; the existing record holds priority")]
    AlreadyAttested,
}
