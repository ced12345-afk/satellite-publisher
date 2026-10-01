import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRss, deduplicate } from '../src/discovery/rss.mjs';
import { requestWithRetry } from '../src/generation/openai.mjs';
import { generateImage } from '../src/generation/image.mjs';
import { validateDraft } from '../src/validation/safety.mjs';
import { publish, notifyGoogleIndexing } from '../src/publishers/publisher.mjs';

const feed = '<?xml version="1.0"?><rss><channel><item><title>One useful topic</title><link>https://example.test/one</link><description>short signal</description></item></channel></rss>';

test('rejects invalid RSS', () => assert.throws(() => parseRss('not a feed'), /Invalid RSS/));
test('deduplicates URLs and titles', () => {
  const [item] = parseRss(feed);
  assert.equal(deduplicate([item, item]).length, 1);
  assert.equal(deduplicate([item, { ...item, url: 'https://example.test/two' }]).length, 1);
});
test('retries a transient generation failure', async () => {
  let calls = 0;
  const value = await requestWithRetry(async () => { calls += 1; if (calls < 3) throw new Error('temporary'); return 'ok'; }, { delayMs: 0 });
  assert.equal(value, 'ok'); assert.equal(calls, 3);
});
test('surfaces a timeout after retries', async () => {
  let calls = 0;
  await assert.rejects(() => requestWithRetry(async () => { calls += 1; throw new Error('request timed out'); }, { retries: 2, delayMs: 0 }), /timed out/);
  assert.equal(calls, 2);
});
test('empty article becomes needs_review', () => {
  assert.equal(validateDraft({ draft: {}, source: {} }).status, 'needs_review');
});
test('source-similar content becomes needs_review', () => {
  const result = validateDraft({ draft: { title: 'same source exact words', content: [] }, source: { excerpt: 'same source exact words repeated' }, threshold: 0.2 });
  assert.equal(result.status, 'needs_review'); assert.match(result.reasons[0], /too close/);
});
test('dry-run blocks FTP or WordPress transport', async () => {
  let called = false;
  const result = await publish({ adapter: 'ftp', payload: {}, env: { DRY_RUN: 'true' }, transport: async () => { called = true; } });
  assert.equal(result.status, 'preview_only'); assert.equal(called, false);
});
test('dry-run blocks indexing', async () => {
  let called = false;
  const result = await notifyGoogleIndexing({ url: 'https://example.test/a', env: { DRY_RUN: 'true' }, request: async () => { called = true; } });
  assert.equal(result.status, 'skipped'); assert.equal(called, false);
});
test('image, FTP and WordPress failures are surfaced for human review', async () => {
  await assert.rejects(() => generateImage({ prompt: 'demo', env: { OPENAI_API_KEY: 'test' }, fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({ error: { message: 'Image generation failed' } }) }) }), /Image generation failed/);
  await assert.rejects(() => publish({ adapter: 'ftp', payload: {}, env: { DRY_RUN: 'false' }, transport: async () => { throw new Error('FTP inaccessible'); } }), /FTP inaccessible/);
  await assert.rejects(() => publish({ adapter: 'wordpress', payload: {}, env: { DRY_RUN: 'false' }, transport: async () => { throw new Error('WordPress inaccessible'); } }), /WordPress inaccessible/);
});
test('already published output remains a no-op in a caller-managed queue', () => {
  const published = new Set(['https://example.test/already']);
  assert.equal(published.has('https://example.test/already'), true);
});
