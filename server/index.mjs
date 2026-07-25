#!/usr/bin/env node
import http from 'node:http';
import { analyze } from '../src/engine.mjs';
import { toMarkdown } from '../src/report.mjs';
import { page } from './ui.mjs';

const PORT = Number(process.env.PORT || 4319);
const MAX_BODY = 8 * 1024 * 1024;
const MAX_SUBMISSIONS = 5000;

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      // Reject oversize uploads while they stream rather than after buffering
      // the whole thing, otherwise the limit protects nothing.
      if (size > MAX_BODY) { reject(new Error('request body too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) {
      const html = page();
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true });

    if (req.method === 'POST' && (req.url === '/api/check' || req.url === '/api/check.md')) {
      const raw = await readBody(req);
      let parsed;
      try { parsed = JSON.parse(raw || '{}'); }
      catch { return json(res, 400, { error: 'body must be JSON' }); }

      const submissions = Array.isArray(parsed) ? parsed : parsed.submissions;
      if (!Array.isArray(submissions)) return json(res, 400, { error: 'expected { submissions: [...] } or a bare array' });
      if (!submissions.length) return json(res, 400, { error: 'no submissions supplied' });
      if (submissions.length > MAX_SUBMISSIONS) return json(res, 413, { error: `at most ${MAX_SUBMISSIONS} submissions per request` });
      const missingId = submissions.findIndex(submission => !submission || submission.id === undefined || submission.id === null);
      if (missingId !== -1) return json(res, 400, { error: `submission at index ${missingId} has no id` });

      const started = Date.now();
      const result = analyze(submissions, parsed.options || {});
      result.elapsedMs = Date.now() - started;

      if (req.url.endsWith('.md')) {
        const titles = new Map(submissions.map(submission => [String(submission.id), submission.title]));
        const markdown = toMarkdown(result, titles);
        res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8' });
        res.end(markdown);
        return;
      }
      return json(res, 200, result);
    }

    json(res, 404, { error: 'not found' });
  } catch (error) {
    json(res, error.message === 'request body too large' ? 413 : 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`precedent listening on http://localhost:${PORT}`);
  console.log(`  POST /api/check      -> JSON report`);
  console.log(`  POST /api/check.md   -> markdown report`);
});
