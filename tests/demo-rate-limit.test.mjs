import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_RATE_LIMIT_KEYS, RATE_LIMIT, RATE_WINDOW_MS, rateLimited } from '../src/lib/demo-rate-limit.ts';

test('10,000 attempts admit five and leave rejected requests out of state', () => {
  const state = new Map();
  const now = 1000;
  let accepted = 0;
  for (let attempt = 0; attempt < 10_000; attempt++) {
    if (!rateLimited(state, 'synthetic-ip', now)) accepted++;
    assert.ok(state.get('synthetic-ip').length <= RATE_LIMIT);
  }
  assert.equal(accepted, RATE_LIMIT);
  const timestamps = state.get('synthetic-ip');
  assert.equal(rateLimited(state, 'synthetic-ip', now + 1), true);
  assert.strictEqual(state.get('synthetic-ip'), timestamps);
  assert.deepEqual(timestamps, Array(RATE_LIMIT).fill(now));
});

test('sliding window expires individual hits at exactly one hour', () => {
  const state = new Map();
  for (let i = 0; i < RATE_LIMIT; i++) {
    assert.equal(rateLimited(state, 'synthetic-ip', i * 1000), false);
  }
  assert.equal(rateLimited(state, 'synthetic-ip', RATE_WINDOW_MS - 1), true);
  assert.equal(rateLimited(state, 'synthetic-ip', RATE_WINDOW_MS), false);
  assert.equal(rateLimited(state, 'synthetic-ip', RATE_WINDOW_MS), true);
  assert.equal(rateLimited(state, 'synthetic-ip', RATE_WINDOW_MS + 1000), false);
  for (let i = 0; i < RATE_LIMIT; i++) {
    assert.equal(rateLimited(state, 'synthetic-ip', 3 * RATE_WINDOW_MS), false);
  }
  assert.equal(rateLimited(state, 'synthetic-ip', 3 * RATE_WINDOW_MS), true);
});

test('capacity rejects new keys without evicting or resetting active quotas', () => {
  const state = new Map();
  for (let i = 0; i < RATE_LIMIT; i++) rateLimited(state, 'synthetic-ip', 0);
  for (let i = 1; i < MAX_RATE_LIMIT_KEYS; i++) {
    assert.equal(rateLimited(state, `synthetic-${i}`, 0), false);
  }
  for (let i = 0; i < 10_000; i++) {
    assert.equal(rateLimited(state, `overflow-${i}`, 1), true);
    assert.equal(state.size, MAX_RATE_LIMIT_KEYS);
  }
  assert.equal(rateLimited(state, 'synthetic-ip', 1), true);
  assert.equal(rateLimited(state, 'synthetic-1', 1), false);
  assert.equal(rateLimited(state, 'new-ip', RATE_WINDOW_MS), false);
  assert.deepEqual([...state.keys()], ['synthetic-1', 'new-ip']);
  assert.equal(rateLimited(state, 'another-ip', 2 * RATE_WINDOW_MS + 1), false);
  assert.deepEqual([...state.keys()], ['another-ip']);
});
