#!/usr/bin/env node
// Minimal client for the attestation program. Deliberately raw @solana/web3.js
// rather than the Anchor TS client: the discriminator and account layout are
// small enough to spell out, and it keeps the dependency list to one package.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey(process.env.PRECEDENT_PROGRAM_ID || '4v3eUeqjyyGq26qypp8jBEpTuHSYYP1tqB1H3DuwX4zc');
const CLUSTER = process.env.PRECEDENT_CLUSTER || 'https://api.devnet.solana.com';
const KEYPAIR_PATH = process.env.PRECEDENT_KEYPAIR || `${process.env.HOME}/.config/solana/id.json`;

// Anchor's instruction discriminator: first 8 bytes of sha256("global:<name>")
function discriminator(name) {
  return crypto.createHash('sha256').update(`global:${name}`).digest().subarray(0, 8);
}

function loadKeypair(path) {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path, 'utf8'))));
}

export function recordAddress(contentHashHex) {
  const hash = Buffer.from(contentHashHex, 'hex');
  return PublicKey.findProgramAddressSync([Buffer.from('precedent'), hash], PROGRAM_ID);
}

export async function attest(contentHashHex, eventIdHex) {
  const connection = new Connection(CLUSTER, 'confirmed');
  const payer = loadKeypair(KEYPAIR_PATH);
  const [record] = recordAddress(contentHashHex);

  const data = Buffer.concat([
    discriminator('attest'),
    Buffer.from(contentHashHex, 'hex'),
    Buffer.from(eventIdHex, 'hex')
  ]);

  const instruction = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: record, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ],
    data
  });

  const transaction = new Transaction().add(instruction);
  const signature = await connection.sendTransaction(transaction, [payer]);
  await connection.confirmTransaction(signature, 'confirmed');
  return { signature, record: record.toBase58() };
}

export async function read(contentHashHex) {
  const connection = new Connection(CLUSTER, 'confirmed');
  const [record] = recordAddress(contentHashHex);
  const info = await connection.getAccountInfo(record);
  if (!info) return null;
  const data = info.data.subarray(8); // strip the account discriminator
  return {
    address: record.toBase58(),
    contentHash: data.subarray(0, 32).toString('hex'),
    eventId: data.subarray(32, 64).toString('hex'),
    submitter: new PublicKey(data.subarray(64, 96)).toBase58(),
    slot: data.readBigUInt64LE(96).toString(),
    unixTimestamp: Number(data.readBigInt64LE(104))
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , hashArg, eventArg] = process.argv;
  const contentHash = hashArg || crypto.createHash('sha256').update('precedent-smoke-test').digest('hex');
  const eventId = eventArg || crypto.createHash('sha256').update('txodds-world-cup-2026').digest('hex');

  console.log(`program  ${PROGRAM_ID.toBase58()}`);
  console.log(`hash     ${contentHash}`);

  const existing = await read(contentHash);
  if (existing) {
    console.log('already attested — first writer holds priority:');
    console.log(existing);
    process.exit(0);
  }

  const { signature, record } = await attest(contentHash, eventId);
  console.log(`attested tx ${signature}`);
  console.log(`record   ${record}`);
  console.log(await read(contentHash));
}
