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
  const carol = t.withIdentity({ subject: 'carol', issuer: 'https://reno.test' });
  return { t, alice, bob, carol };
}
type User = ReturnType<typeof setup>['alice'];
async function sample(user: User) {
  await user.mutation(api.notebook.initialize, {});
  return (await user.query(api.notebook.get, {}))!.projects[0].id;
}
const payment = (projectId: string, id: string, cents: number) => ({ type: 'payment' as const, projectId, id, cents, date: '2026-10-13', method: 'Bank transfer', note: '', at: '1900-01-01T00:00:00Z' });

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
    const [a, b] = [(await alice.query(api.notebook.get, {}))!.projects[0].id, (await bob.query(api.notebook.get, {}))!.projects[0].id];
    expect(a).toMatch(/^kitchen-[0-9a-f]{16}$/);
    expect(a).not.toBe(b);
  });
  test('approval is idempotent and adjusts budget and finish exactly once', async () => {
    const { alice, bob } = setup();
    const projectId = await sample(alice);
    await bob.mutation(api.notebook.initialize, {});
    const action = { type: 'change-decision' as const, projectId, id: 'trim', decision: 'approved' as const, at: '1900-01-01T00:00:00Z' };
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
    const projectId = await sample(alice);
    await alice.mutation(api.notebook.commit, { action: payment(projectId, 'repeat', 10000) });
    await alice.mutation(api.notebook.commit, { action: payment(projectId, 'repeat', 10000) });
    let p = (await alice.query(api.notebook.get, {}))!.projects[0];
    expect(p.payments.filter(row => row.id === 'repeat')).toHaveLength(1);
    const results = await Promise.allSettled([
      alice.mutation(api.notebook.commit, { action: payment(projectId, 'one', 200000) }),
      alice.mutation(api.notebook.commit, { action: payment(projectId, 'two', 200000) }),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    p = (await alice.query(api.notebook.get, {}))!.projects[0];
    expect(remaining(p)).toBe(126000);
  });
  test('role and completion guards remain authoritative on the server', async () => {
    const { alice } = setup();
    const projectId = await sample(alice);
    await expect(alice.mutation(api.notebook.commit, { action: { type: 'punch-review', projectId, id: 'window', status: 'resolved', note: '', at: '' } })).rejects.toThrow('submit');
    await alice.mutation(api.notebook.commit, { action: { type: 'profile', name: 'Alice', role: 'contractor' } });
    await expect(alice.mutation(api.notebook.commit, { action: payment(projectId, 'forbidden', 100) })).rejects.toThrow('homeowner');
    await alice.mutation(api.notebook.commit, { action: { type: 'profile', name: 'Alice', role: 'homeowner' } });
    await expect(alice.mutation(api.notebook.commit, { action: { type: 'complete', projectId, at: '' } })).rejects.toThrow('pending');
  });
  test('capacity errors preserve all timeline records instead of truncating', async () => {
    const { alice } = setup();
    const projectId = await sample(alice);
    await alice.run(async ctx => {
      for (let index = 3; index < 300; index++) await ctx.db.insert('events', { projectId, position: index, value: { id: 'capacity-' + index, at: '2026-10-13T12:00:00Z', kind: 'update', author: 'Alice', text: 'Saved entry' } });
    });
    await expect(alice.mutation(api.notebook.commit, { action: { type: 'update', projectId, id: 'overflow', text: 'One too many', at: '' } })).rejects.toThrow('limit of 300');
    const saved = (await alice.query(api.notebook.get, {}))!.projects[0].events;
    expect(saved).toHaveLength(300);
    expect(saved.some(event => event.id === 'overflow')).toBe(false);
  });
  test('rejects image spoofing and cross-owner photo attachment', async () => {
    const { alice, bob } = setup();
    const projectId = await sample(alice);
    const bobProject = await sample(bob);
    await expect(alice.action(api.files.upload, { data: new TextEncoder().encode('<svg/>').buffer, contentType: 'image/png', name: 'bad.png' })).rejects.toThrow('JPEG');
    const data = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1kAAAAASUVORK5CYII='), c => c.charCodeAt(0)).buffer;
    const photo = await alice.action(api.files.upload, { data, contentType: 'image/png', name: 'tile.png' });
    await expect(bob.mutation(api.notebook.commit, { action: { type: 'update', projectId: bobProject, id: 'stolen', text: '', photo, at: '' } })).rejects.toThrow('does not belong');
    await alice.mutation(api.notebook.commit, { action: { type: 'update', projectId, id: 'mine', text: '', photo, at: '' } });
    expect((await alice.query(api.notebook.get, {}))!.projects[0].events[0].photo?.name).toBe('tile.png');
  });
});

const draft = { title: 'Primary bath tile', type: 'Bathroom', scope: 'Replace shower tile and regrout the floor.', zip: '32084', timing: 'Next month', area: '60 sq ft', photos: [] };
const quote = (projectId: string, id: string) => ({ type: 'send-quote' as const, projectId, id, company: 'Coastal Tile', depositPercent: 25, durationDays: 5, start: '2026-11-02', cleanup: true, items: [{ label: 'Tile labor', cents: 300000 }, { label: 'Materials', cents: 100000 }], at: '' });
async function realProject(user: User) {
  await user.mutation(api.notebook.initialize, {});
  await user.mutation(api.notebook.commit, { action: { type: 'profile', name: 'Alice', role: 'homeowner' } });
  await user.mutation(api.notebook.commit, { action: { type: 'save-draft', draft } });
  await user.mutation(api.notebook.commit, { action: { type: 'create-project', id: 'bath-1', at: '' } });
  return 'bath-1';
}

describe('shared projects', () => {
  test('project IDs are global: another user cannot reuse or reach one', async () => {
    const { alice, bob } = setup();
    const projectId = await realProject(alice);
    await bob.mutation(api.notebook.initialize, {});
    await bob.mutation(api.notebook.commit, { action: { type: 'save-draft', draft } });
    await expect(bob.mutation(api.notebook.commit, { action: { type: 'create-project', id: projectId, at: '' } })).rejects.toThrow('already in use');
    // Not a member, so the project is invisible and untouchable.
    expect((await bob.query(api.notebook.get, {}))!.projects.map(p => p.id)).not.toContain(projectId);
    await expect(bob.mutation(api.notebook.commit, { action: { type: 'update', projectId, id: 'x', text: 'hi', at: '' } })).rejects.toThrow();
    await expect(bob.mutation(api.invites.create, { projectId })).rejects.toThrow('Only the homeowner');
  });

  test('invite, quote, accept, change and approve across two people', async () => {
    const { alice, bob } = setup();
    const projectId = await realProject(alice);
    await bob.mutation(api.notebook.initialize, {});
    await bob.mutation(api.notebook.commit, { action: { type: 'profile', name: 'Bob', role: 'homeowner' } });

    const { token, expiresAt } = await alice.mutation(api.invites.create, { projectId });
    expect(token).toMatch(/^[0-9a-f]{32}$/);
    const hours = (Date.parse(expiresAt) - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(47.9);
    expect(hours).toBeLessThanOrEqual(48);
    let mine = (await alice.query(api.notebook.get, {}))!.projects.find(p => p.id === projectId)!;
    expect(mine.invite?.token).toBe(token);
    expect(mine.viewerRole).toBe('homeowner');

    const preview = await bob.query(api.invites.preview, { token });
    expect(preview).toMatchObject({ status: 'ok', title: 'Primary bath tile', homeowner: 'Alice' });
    expect(await bob.mutation(api.invites.accept, { token })).toEqual({ projectId });
    expect(await bob.query(api.invites.preview, { token })).toMatchObject({ status: 'used' });

    let theirs = (await bob.query(api.notebook.get, {}))!.projects.find(p => p.id === projectId)!;
    expect(theirs.viewerRole).toBe('contractor');
    expect(theirs.invite).toBeNull();
    expect(theirs.members).toEqual([{ name: 'Alice', role: 'homeowner' }, { name: 'Bob', role: 'contractor' }]);
    expect(theirs.events[0].text).toContain('Bob joined');

    // Roles come from membership, not the profile toggle.
    await expect(alice.mutation(api.notebook.commit, { action: quote(projectId, 'q1') })).rejects.toThrow('contractor');
    await bob.mutation(api.notebook.commit, { action: quote(projectId, 'q1') });
    await expect(bob.mutation(api.notebook.commit, { action: { type: 'accept-quote', projectId, quoteId: 'q1', at: '' } })).rejects.toThrow('homeowner');
    await alice.mutation(api.notebook.commit, { action: { type: 'accept-quote', projectId, quoteId: 'q1', at: '' } });

    await bob.mutation(api.notebook.commit, { action: { type: 'propose-change', projectId, id: 'niche', title: 'Add a niche', reason: 'Wall is open', cents: 40000, days: 1, at: '' } });
    mine = (await alice.query(api.notebook.get, {}))!.projects.find(p => p.id === projectId)!;
    expect(mine.status).toBe('active');
    expect(mine.changes.map(c => c.id)).toEqual(['niche']);
    await alice.mutation(api.notebook.commit, { action: { type: 'change-decision', projectId, id: 'niche', decision: 'approved', at: '' } });
    theirs = (await bob.query(api.notebook.get, {}))!.projects.find(p => p.id === projectId)!;
    expect(theirs.changes[0].status).toBe('approved');
    expect(total(theirs)).toBe(440000);
  });

  test('invites are single use, revocable, expire, and allow one contractor', async () => {
    const { t, alice, bob, carol } = setup();
    const projectId = await realProject(alice);
    for (const user of [bob, carol]) await user.mutation(api.notebook.initialize, {});

    const first = await alice.mutation(api.invites.create, { projectId });
    await alice.mutation(api.invites.revoke, { projectId });
    expect(await bob.query(api.invites.preview, { token: first.token })).toMatchObject({ status: 'invalid' });
    expect(await bob.query(api.invites.preview, { token: 'nope' })).toMatchObject({ status: 'invalid' });

    const second = await alice.mutation(api.invites.create, { projectId });
    expect(await alice.query(api.invites.preview, { token: second.token })).toMatchObject({ status: 'member' });
    await expect(alice.mutation(api.invites.accept, { token: second.token })).rejects.toThrow('already on');
    await t.run(async ctx => {
      const row = await ctx.db.query('invites').withIndex('by_token', q => q.eq('token', second.token)).unique();
      await ctx.db.patch(row!._id, { expiresAt: 0 });
    });
    await expect(bob.mutation(api.invites.accept, { token: second.token })).rejects.toThrow('expired');

    const third = await alice.mutation(api.invites.create, { projectId });
    await bob.mutation(api.invites.accept, { token: third.token });
    await expect(carol.mutation(api.invites.accept, { token: third.token })).rejects.toThrow('already been used');
    await expect(alice.mutation(api.invites.create, { projectId })).rejects.toThrow('already has a contractor');
  });

  test('sample projects cannot be shared', async () => {
    const { alice } = setup();
    const projectId = await sample(alice);
    await expect(alice.mutation(api.invites.create, { projectId })).rejects.toThrow('Sample');
  });

  test('invite links open the app, with a fallback page', async () => {
    const { t, alice } = setup();
    const projectId = await realProject(alice);
    const { token } = await alice.mutation(api.invites.create, { projectId });
    const page = await t.fetch(`/join/${token}`, { method: 'GET' });
    expect(page.status).toBe(200);
    expect(await page.text()).toContain(`reno://join/${token}`);
    expect((await t.fetch('/join/<script>', { method: 'GET' })).status).toBe(404);
  });
});
