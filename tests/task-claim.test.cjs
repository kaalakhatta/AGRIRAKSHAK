const { test } = require('node:test');
const assert = require('node:assert/strict');
const { claim } = require('../.github/scripts/claim.cjs');
const { isAllowedPath } = require('../.github/scripts/scope.cjs');
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

const liveRegistry = require('../docs/farm-context/tasks.json');
test('every registered contributor can claim only the mapped task and receives its current branch', async () => {
  for (const task of liveRegistry.tasks) {
    const actor = liveRegistry.contributors[task.contributor];
    assert.ok(actor, `missing mapping for ${task.contributor}`);
    const calls = await run({ actor, issue: task.issue, config: liveRegistry });
    assert.deepEqual(calls[0], ['assign', [actor]]);
    assert.ok(calls[1][1].includes(task.branch));
    for (const path of task.paths) assert.ok(calls[1][1].includes(path));
    for (const other of liveRegistry.tasks.filter(t => t.contributor !== task.contributor)) {
      const denied = await run({ actor: liveRegistry.contributors[other.contributor], issue: task.issue, config: liveRegistry });
      assert.equal(denied.length, 1);
      assert.match(denied[0][1], /not mapped/);
    }
  }
});
test('returning contributors cannot claim without repository write access', async () => {
  for (const name of ['Anushka', 'Aanya']) {
    const task = liveRegistry.tasks.find(t => t.contributor === name);
    assert.ok(task);
    const calls = await run({ actor: liveRegistry.contributors[name], issue: task.issue, permission: 'read', config: liveRegistry });
    assert.equal(calls.length, 1);
    assert.match(calls[0][1], /write access/);
  }
});
test('registered tasks have unique identities and disjoint exclusive teammate scopes', () => {
  for (const key of ['task', 'issue', 'branch']) {
    assert.equal(new Set(liveRegistry.tasks.map(t => t[key])).size, liveRegistry.tasks.length, `duplicate ${key}`);
  }
  const teammates = liveRegistry.tasks.filter(t => !t.paths.includes('*'));
  for (const task of teammates) {
    assert.ok(task.paths.length >= 2);
    assert.ok(Number.isInteger(task.issue) && task.issue > 0);
    for (const path of task.paths) assert.ok(!path.startsWith('/') && !path.split('/').includes('..'));
    for (const other of teammates.filter(t => t.task !== task.task)) {
      for (const path of task.paths) for (const peer of other.paths) {
        assert.ok(!path.startsWith(peer) && !peer.startsWith(path), `${task.contributor}/${other.contributor} overlap: ${path}, ${peer}`);
      }
    }
  }
});

test('Yashi owns training and research, while runtime and farm catalogs remain owner scope', () => {
  const paths = liveRegistry.tasks.find(t => t.contributor === 'Yashi').paths;
  for (const file of ['docs/research/farm-context/SOURCES.md', 'ml/src/agrirakshak_ml/train.py', 'ml/tests/test_metrics.py', 'ml/notebooks/agrirakshak_colab_training.ipynb', 'ml/COLAB.md', 'ml/pyproject.toml', 'ml/README.md', 'ml/MODEL_CARD_TEMPLATE.md']) assert.equal(isAllowedPath(paths, file), true, file);
  for (const file of ['data/catalog/farm-context/action.schema.json', 'apps/web/lib/recommendations/engine.ts', 'ml/dataset_audit/audit.py', 'ml/farm_context_audit/test.py', 'ml/COLAB.md.bak', 'ml/README.md/other', 'ml/notebooks-extra/a.ipynb', '.github/workflows/ml-unit.yml', 'package.json']) assert.equal(isAllowedPath(paths, file), false, file);
});
test('scope rejects traversal and checks both sides of a rename', () => {
  const paths = ['ml/notebooks/', 'ml/COLAB.md'];
  for (const file of ['/ml/COLAB.md', 'ml/notebooks/../dataset_audit/a.py', 'ml/notebooks/./a.py', 'ml//notebooks/a.py', 'ml\\notebooks\\a.py']) assert.equal(isAllowedPath(paths, file), false);
  const permitted = change => [change.filename, change.previous_filename].filter(Boolean).every(file => isAllowedPath(paths, file));
  assert.equal(permitted({filename: 'ml/notebooks/new.ipynb', previous_filename: 'ml/notebooks/old.ipynb'}), true);
  assert.equal(permitted({filename: 'ml/notebooks/new.ipynb', previous_filename: 'data/catalog/action.json'}), false);
  assert.equal(permitted({filename: 'data/catalog/action.json', previous_filename: 'ml/notebooks/old.ipynb'}), false);
});

async function scopeWorkflow({ actor, branch, assignees, files = [], helperInstalled = true }) {
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../.github/workflows/team-scope.yml'), 'utf8');
  const script = source.split('          script: |\n')[1].split('\n').filter(line => line.startsWith('            ')).map(line => line.slice(12)).join('\n');
  const failures = [], imports = [];
  const scopedRequire = id => {
    imports.push(id);
    if (id === 'node:fs') return { existsSync: () => true };
    if (id.endsWith('tasks.json')) return liveRegistry;
    if (id.endsWith('scope.cjs') && helperInstalled) return { isAllowedPath };
    throw new Error(`Unavailable base-branch module: ${id}`);
  };
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction('require', 'context', 'github', 'core', script)(scopedRequire,
    { repo: { owner: liveRegistry.owner, repo: 'repo' }, payload: { pull_request: { user: { login: actor }, head: { ref: branch }, number: 18 } } },
    { rest: { issues: { get: async () => ({ data: { assignees: assignees.map(login => ({login})) } }) }, pulls: { listFiles: () => {} } }, paginate: async () => files },
    { setFailed: message => failures.push(message) });
  return { failures, imports };
}
test('scope workflow can bootstrap helper on owner PR while still checking mapped author and claim', async () => {
  const owner = liveRegistry.tasks.find(t => t.contributor === 'Arindam');
  const args = { actor: liveRegistry.owner, branch: owner.branch, assignees: [liveRegistry.owner], helperInstalled: false };
  const result = await scopeWorkflow(args);
  assert.deepEqual(result.failures, []);assert.ok(!result.imports.some(id => id.endsWith('scope.cjs')));
  assert.match((await scopeWorkflow({...args,assignees:[]})).failures[0], /Claim/);
  assert.match((await scopeWorkflow({...args,actor:'intruder'})).failures[0], /author/);
});
test('scope workflow enforces current training scopes and both rename paths', async () => {
  const yashi = liveRegistry.tasks.find(t => t.contributor === 'Yashi');
  const args = { actor: liveRegistry.contributors.Yashi, branch: yashi.branch, assignees: [liveRegistry.contributors.Yashi] };
  assert.deepEqual((await scopeWorkflow({...args, files:[{filename:'ml/COLAB.md'}]})).failures, []);
  for (const files of [[{filename:'ml/COLAB.md.bak'}], [{filename:'ml/notebooks/new.ipynb',previous_filename:'data/catalog/action.json'}], [{filename:'data/catalog/action.json',previous_filename:'ml/notebooks/old.ipynb'}]]) assert.match((await scopeWorkflow({...args,files})).failures[0], /Outside/);
});


test('Aanya account switch maps n0debug and rejects the previous account', async () => {
  const task = liveRegistry.tasks.find(t => t.contributor === 'Aanya');
  assert.equal(liveRegistry.contributors.Aanya, 'n0debug');
  const current = await run({actor:'n0debug',issue:task.issue,config:liveRegistry});
  assert.deepEqual(current[0], ['assign', ['n0debug']]);
  assert.match(current[1][1], /Claim confirmed/);
  const old = await run({actor:'aanya25bce11372-stack',issue:task.issue,config:liveRegistry});
  assert.equal(old.length,1);
  assert.match(old[0][1], /not mapped/);
});
