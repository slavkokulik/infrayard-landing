import test from 'node:test';
import assert from 'node:assert/strict';
import { sendContactRequest } from '../assets/contact-request.js';

const payload = new FormData();
payload.set('name', 'Local test');
const result = (success, status = 200) => async () => new Response(JSON.stringify({ success }), { status, headers: { 'Content-Type': 'application/json' } });

test('accepts only an explicit success from the contact processor', async () => {
  for (const success of [true, 'true']) assert.equal((await sendContactRequest('hello@infrayard.eu', payload, { fetcher: result(success) })).success, success);
});
test('HTTP failure cannot be mistaken for a successful submission', async () => {
  await assert.rejects(sendContactRequest('hello@infrayard.eu', payload, { fetcher: result(true, 500) }));
});
test('a rejected or missing processor confirmation fails', async () => {
  for (const success of [false, 'false', undefined, 'pending']) await assert.rejects(sendContactRequest('hello@infrayard.eu', payload, { fetcher: result(success) }));
});
test('network and invalid JSON failures propagate to the form error state', async () => {
  await assert.rejects(sendContactRequest('hello@infrayard.eu', payload, { fetcher: async () => { throw new Error('offline'); } }));
  await assert.rejects(sendContactRequest('hello@infrayard.eu', payload, { fetcher: async () => new Response('<html>error</html>') }));
});
test('times out a stalled request without reporting acceptance', async () => {
  const fetcher = (_, options) => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
  await assert.rejects(sendContactRequest('support@infrayard.eu', payload, { fetcher, timeoutMs: 5 }), /aborted/);
});
test('only the documented contact destinations can be used', async () => {
  let called = false;
  await assert.rejects(sendContactRequest('other@example.com', payload, { fetcher: async () => { called = true; } }));
  assert.equal(called, false);
});
