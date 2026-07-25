#!/usr/bin/env python3
"""Trim and redact a Claude Code session transcript before sharing it.

Session transcripts are a fine proof of AI-assisted development, but a raw one
carries everything else that happened in the session too: other projects, tokens,
emails, absolute paths. This keeps the part of the conversation that belongs to
this project and redacts credential-shaped strings from what remains.

  python3 scripts/trim-transcript.py in.jsonl out.jsonl --start-marker "okay continue"

Redaction is regex over the raw JSON line, so replacements never introduce quotes
or backslashes and the output stays valid JSONL.
"""
import argparse
import json
import re
import sys

REDACTIONS = [
    # JWTs / bearer tokens (Colosseum PAT, and anything else shaped like one)
    (re.compile(r'eyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}'), '[REDACTED_TOKEN]'),
    (re.compile(r'\b(gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})\b'), '[REDACTED_KEY]'),
    (re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'), '[REDACTED_EMAIL]'),
    # keypair file paths — the key itself is never in the transcript, but the
    # location of it does not need publishing either
    (re.compile(r'(?:~|/Users/[A-Za-z0-9._\-]+)/[A-Za-z0-9._\-]*keys?[A-Za-z0-9._\-]*/[A-Za-z0-9._\-]+\.json'), '[REDACTED_KEYPAIR_PATH]'),
    (re.compile(r'[A-Za-z0-9._\-]*-keys\b'), '[REDACTED_KEYPAIR_PATH]'),
]


def user_text(entry):
    message = entry.get('message')
    if not isinstance(message, dict) or message.get('role') != 'user':
        return ''
    content = message.get('content')
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return ' '.join(b.get('text', '') for b in content if isinstance(b, dict) and b.get('type') == 'text')
    return ''


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('output')
    parser.add_argument('--start-marker', required=True,
                        help='keep from the first user message containing this text')
    parser.add_argument('--extra-redact', action='append', default=[],
                        help='literal string to redact (repeatable)')
    args = parser.parse_args()

    lines = open(args.source, encoding='utf-8').read().splitlines()

    start = None
    for index, line in enumerate(lines):
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if args.start_marker.lower() in user_text(entry).lower():
            start = index
            break

    if start is None:
        sys.exit(f'start marker not found: {args.start_marker!r}')

    literals = [(re.compile(re.escape(value), re.IGNORECASE), '[REDACTED]') for value in args.extra_redact]

    kept = 0
    redacted = 0
    with open(args.output, 'w', encoding='utf-8') as out:
        for line in lines[start:]:
            for pattern, replacement in REDACTIONS + literals:
                line, count = pattern.subn(replacement, line)
                redacted += count
            try:
                json.loads(line)  # never emit a line the redaction broke
            except json.JSONDecodeError:
                continue
            out.write(line + '\n')
            kept += 1

    print(f'dropped {start} entries before the marker')
    print(f'kept    {kept} entries')
    print(f'applied {redacted} redactions')


if __name__ == '__main__':
    main()
