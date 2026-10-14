/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';
import { remaining, total } from '../src/domain/model';

const modules = import.meta.glob('./**/*.ts');
function setup() {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: 'alice', issuer: 'https://reno.test' });
  const bob = t.withIdentity({ subject: 'bob', issuer: 'https://reno.test' });
  return { t, alice, bob };
}
const payment = (id: string, cents: number) => ({ type: 'payment' as const, projectId: 'kitchen', id, cents, date: '2026-10-13', method: 'Bank transfer', note: '', at: '1900-01-01T00:00:00Z' });

describe('private notebook transactions', () => {
  test('requires authentication and isolates users with identical sample IDs', async () => {
    const { t, alice, bob } = setup();
    await expect(t.query(api.notebook.get, {})).rejects.toThrow('Sign in');
    await expect(t.mutation(api.notebook.initialize, {})).rejects.toThrow('Sign in');
    await alice.mutation(api.notebook.initialize, {});
    await alice.mutation(api.notebook.initialize, {});
    expect(await bob.query(api.notebook.get, {})).toBeNull();
    await bob.mutation(api.notebook.initialize, {});
    await alice.mutation(api.notebook.commit, { action: { type: 'profile', name: 'Alice', role: 'homeowner' } });
    expect((await alice.query(api.notebook.get, {}))?.name).toBe('Alice');
    expect((await bob.query(api.notebook.get, {}))?.name).toBe('Maya');
    expect((await alice.query(api.notebook.get, {}))?.projects).toHaveLength(1);
  });
  test('approval is idempotent and adjusts budget and finish exactly once', async () => {
    const { alice, bob } = setup();
    await alice.mutation(api.notebook.initialize, {});
    await bob.mutation(api.notebook.initialize, {});
    const action = { type: 'change-decision' as const, projectId: 'kitchen', id: 'trim', decision: 'approved' as const, at: '1900-01-01T00:00:00Z' };
    await Promise.all([alice.mutation(api.notebook.commit, { action }), alice.mutation(api.notebook.commit, { action })]);
    const p = (await alice.query(api.notebook.get, {}))!.projects[0];
    expect(total(p)).toBe(504000);
    expect(p.finish).toBe('2026-10-24');
    expect(p.events.filter(event => event.id === 'decision-trim')).toHaveLength(1);
    expect(p.changes[0].decidedAt).not.toBe(action.at);
    expect((await bob.query(api.notebook.get, {}))!.projects[0].changes[0].status).toBe('pending');
    await expect(alice.mutation(api.notebook.commit, { action: { ...action, decision: 'declined' } })).rejects.toThrow('already');
  });
  test('payment retry is idempotent and concurrent overpayments cannot both succeed', async () => {
    const { alice } = setup();
    await alice.mutation(api.notebook.initialize, {});
    await alice.mutation(api.notebook.commit, { action: payment('repeat', 10000) });
    await alice.mutation(api.notebook.commit, { action: payment('repeat', 10000) });
    let p = (await alice.query(api.notebook.get, {}))!.projects[0];
    expect(p.payments.filter(row => row.id === 'repeat')).toHaveLength(1);
    const results = await Promise.allSettled([
      alice.mutation(api.notebook.commit, { action: payment('one', 200000) }),
      alice.mutation(api.notebook.commit, { action: payment('two', 200000) }),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    p = (await alice.query(api.notebook.get, {}))!.projects[0];
    expect(remaining(p)).toBe(126000);
  });
  test('role and completion guards remain authoritative on the server', async () => {
    const { alice } = setup();
    await alice.mutation(api.notebook.initialize, {});
    await expect(alice.mutation(api.notebook.commit, { action: { type: 'punch-review', projectId: 'kitchen', id: 'window', status: 'resolved', note: '', at: '' } })).rejects.toThrow('submit');
    await alice.mutation(api.notebook.commit, { action: { type: 'profile', name: 'Alice', role: 'contractor' } });
    await expect(alice.mutation(api.notebook.commit, { action: payment('forbidden', 100) })).rejects.toThrow('homeowner');
    await alice.mutation(api.notebook.commit, { action: { type: 'profile', name: 'Alice', role: 'homeowner' } });
    await expect(alice.mutation(api.notebook.commit, { action: { type: 'complete', projectId: 'kitchen', at: '' } })).rejects.toThrow('pending');
  });
  test('capacity errors preserve all timeline records instead of truncating', async () => {
    const { alice } = setup();
    await alice.mutation(api.notebook.initialize, {});
    await alice.run(async ctx => {
      const ownerId = (await ctx.auth.getUserIdentity())!.tokenIdentifier;
      for (let index = 3; index < 300; index++) await ctx.db.insert('events', { ownerId, projectId: 'kitchen', position: index, value: { id: 'capacity-' + index, at: '2026-10-13T12:00:00Z', kind: 'update', author: 'Alice', text: 'Saved entry' } });
    });
    await expect(alice.mutation(api.notebook.commit, { action: { type: 'update', projectId: 'kitchen', id: 'overflow', text: 'One too many', at: '' } })).rejects.toThrow('limit of 300');
    const saved = (await alice.query(api.notebook.get, {}))!.projects[0].events;
    expect(saved).toHaveLength(300);
    expect(saved.some(event => event.id === 'overflow')).toBe(false);
  });
  test('rejects image spoofing and cross-owner photo attachment', async () => {
    const { alice, bob } = setup();
    await alice.mutation(api.notebook.initialize, {});
    await bob.mutation(api.notebook.initialize, {});
    await expect(alice.action(api.files.upload, { data: new TextEncoder().encode('<svg/>').buffer, contentType: 'image/png', name: 'bad.png' })).rejects.toThrow('JPEG');
    const data = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1kAAAAASUVORK5CYII='), c => c.charCodeAt(0)).buffer;
    const photo = await alice.action(api.files.upload, { data, contentType: 'image/png', name: 'tile.png' });
    await expect(bob.mutation(api.notebook.commit, { action: { type: 'update', projectId: 'kitchen', id: 'stolen', text: '', photo, at: '' } })).rejects.toThrow('does not belong');
    await alice.mutation(api.notebook.commit, { action: { type: 'update', projectId: 'kitchen', id: 'mine', text: '', photo, at: '' } });
    expect((await alice.query(api.notebook.get, {}))!.projects[0].events[0].photo?.name).toBe('tile.png');
  });
});
