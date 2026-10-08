const { test } = require('node:test');
const assert = require('node:assert/strict');
const { claim } = require('../.github/scripts/claim.cjs');
const registry = { owner: 'owner', contributors: { Kanika: 'kanika' }, tasks: [{ task: 6, issue: 6, contributor: 'Kanika', branch: 'codex/task6', paths: ['ml/audit/'], brief: 'brief.md' }] };
async function run({ actor = 'kanika', command = '/claim', assignees = [], state = 'open', permission = 'write', issue = 6, pr = false, config = registry } = {}) {
  const calls = [];
  const github = { rest: { issues: {
    get: async () => ({ data: { state, assignees: assignees.map(login => ({ login })) } }),
    createComment: async x => calls.push(['comment', x.body]),
    addAssignees: async x => calls.push(['assign', x.assignees]),
    removeAssignees: async x => calls.push(['release', x.assignees])
  }, repos: { getCollaboratorPermissionLevel: async () => ({ data: { permission } }) } } };
  await claim({ github, registry: config, context: { repo: { owner: 'owner', repo: 'repo' }, payload: { comment: { body: command, user: { login: actor } }, issue: { number: issue, pull_request: pr } } } });
  return calls;
}
test('mapped collaborator claims and receives branch', async () => { const c = await run(); assert.equal(c[0][0], 'assign'); assert.match(c[1][1], /codex\/task6/); });
test('second account cannot steal an assigned task', async () => { const c = await run({ actor: 'intruder', assignees: ['kanika'] }); assert.equal(c.length, 1); assert.match(c[0][1], /not mapped/); });
test('existing foreign assignment is preserved', async () => assert.match((await run({ assignees: ['other'] }))[0][1], /Already claimed/));
test('repeat claim is idempotent', async () => assert.equal((await run({ assignees: ['kanika'] })).length, 1));
test('read access is insufficient', async () => assert.match((await run({ permission: 'read' }))[0][1], /write access/));
test('closed and unregistered issues fail closed', async () => { assert.match((await run({ state: 'closed' }))[0][1], /closed/); assert.match((await run({ issue: 55 }))[0][1], /not an active/); });
test('missing identity mapping blocks claim', async () => assert.match((await run({ config: { ...registry, contributors: {} } }))[0][1], /TBD/));
test('only assignee or owner releases', async () => { assert.equal((await run({ command: '/unclaim', assignees: ['kanika'] }))[0][0], 'release'); assert.equal((await run({ command: '/unclaim', actor: 'owner', assignees: ['kanika'] }))[0][0], 'release'); assert.match((await run({ command: '/unclaim', actor: 'other', assignees: ['kanika'] }))[0][1], /Only/); });
test('PR comments and other commands are ignored', async () => { assert.deepEqual(await run({ pr: true }), []); assert.deepEqual(await run({ command: '/claim somebody' }), []); });
