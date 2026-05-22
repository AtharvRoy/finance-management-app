import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './index.js';

const app = createApp();

test('health works', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('simulator validates payload', async () => {
  const res = await request(app).post('/api/simulator').send({});
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation failed');
});

test('income payload validation rejects invalid numbers', async () => {
  const res = await request(app).post('/api/incomes').send({ userId: 'bad', month: '2026-05-01', amount: 1000 });
  assert.equal(res.status, 400);
});
