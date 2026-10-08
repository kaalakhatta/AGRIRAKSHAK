// Run with the contributor's own gh account. No PR code, shell, token output or admin bypass.
const { execFileSync } = require('node:child_process');
const { isAllowedPath } = require('./scope.cjs');
const REPO = 'kaalakhatta/AGRIRAKSHAK';
const REQUIRED_CHECKS = ['web', 'api', 'ml-unit', 'scope', 'tests'];
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();
function requireValue(ok, message) { if (!ok) throw new Error(message); }
function eligibility({ registry, actor, permission, pr, issue, comments, files, checks, reviews, threads, comparison }) {
  requireValue(['admin','maintain','write'].includes(permission), 'Your mapped account needs repository write access.');
  requireValue(pr.state === 'open' && !pr.draft && !pr.merged && pr.base?.ref === 'main' && pr.base?.repo?.full_name === REPO, 'Use an open, non-draft PR to canonical main.');
  const task = registry.tasks.find(task => task.branch === pr.head?.ref);
  requireValue(task && same(registry.contributors[task.contributor], actor) && same(pr.user?.login, actor), 'Only the mapped author may self-merge their registered task PR.');
  requireValue(/^[a-f0-9]{40}$/.test(pr.head.sha), 'Invalid PR head.');
  requireValue(issue.state === 'open' && issue.assignees?.length === 1 && same(issue.assignees[0].login, actor), 'Your active task claim must still be assigned to your account.');
  requireValue(comments.some(comment => comment.user?.type === 'Bot' && same(comment.user.login, 'github-actions[bot]') && typeof comment.body === 'string' && comment.body.toLowerCase().includes(`Claim confirmed for @${actor}: Task ${task.task}.`.toLowerCase())), 'A real bot-confirmed task claim is required.');
  requireValue(new RegExp(`\\b(?:Refs|Closes|Fixes|Resolves)\\s+#${task.issue}\\b`, 'i').test(pr.body || ''), 'Link your cumulative task issue in the PR body.');
  requireValue(/^Self-review: complete\s*$/im.test(pr.body || ''), 'Review the entire diff, fix known blockers and add Self-review: complete to the PR body.');
  requireValue(Array.isArray(files) && files.length > 0 && files.length === pr.changed_files, 'The complete changed-file list must be available.');
  requireValue(files.every(file => [file.filename,file.previous_filename].filter(Boolean).every(path => isAllowedPath(task.paths,path))), 'Changed files or rename sources are outside your assigned scope.');
  requireValue(['ahead','identical'].includes(comparison), 'Merge current main into your task branch and rerun CI before self-merging.');
  for (const name of REQUIRED_CHECKS) {
    const matches = checks.filter(check => check.name === name && check.app?.slug === 'github-actions');
    requireValue(matches.length === 1 && matches[0].head_sha === pr.head.sha && matches[0].status === 'completed' && matches[0].conclusion === 'success', `Required check ${name} has not passed on this PR head.`);
  }
  requireValue(checks.every(check => check.head_sha === pr.head.sha && check.status === 'completed' && check.conclusion === 'success'), 'A check is pending or unsuccessful. Do not bypass it.');
  const decisions = new Map();
  for (const review of reviews) if (['APPROVED','CHANGES_REQUESTED'].includes(review.state)) decisions.set(review.user.login.toLowerCase(),review.state);
  requireValue(![...decisions.values()].includes('CHANGES_REQUESTED'), 'Address the outstanding requested changes before merging.');
  requireValue(threads.every(thread => thread.isResolved === true), 'Resolve outstanding review discussions before merging.');
  requireValue(pr.mergeable === true && pr.mergeable_state === 'clean', 'GitHub mergeability is not clean. Resolve conflicts/requirements or wait and retry.');
  return { head:pr.head.sha, task:task.task, issue:task.issue };
}
function gh(args) { return execFileSync('gh', args, {encoding:'utf8',maxBuffer:16*1024*1024}); }
function api(path) { return JSON.parse(gh(['api',path])); }
function pages(path, key) { return JSON.parse(gh(['api',path,'--paginate','--slurp'])).flatMap(page => key ? page[key] : page); }
async function main(args) {
  requireValue(args.length >= 1 && args.length <= 2 && /^[1-9]\d*$/.test(args[0]) && (args.length === 1 || args[1] === '--check'), 'Usage: node .github/scripts/self-merge.cjs PR_NUMBER [--check]');
  const number = Number(args[0]);
  requireValue(Number.isSafeInteger(number), 'Invalid PR number.');
  const actor = api('user').login;
  const base = api(`repos/${REPO}/git/ref/heads/main`).object.sha;
  const content = api(`repos/${REPO}/contents/docs/farm-context/tasks.json?ref=${base}`);
  const registry = JSON.parse(Buffer.from(content.content,'base64').toString('utf8'));
  const pr = api(`repos/${REPO}/pulls/${number}`);
  const task = registry.tasks.find(task => task.branch === pr.head?.ref);
  requireValue(task, 'Use your registered task branch.');
  const threads = [];
  let cursor = null;
  do {
    const query = 'query($number:Int!,$cursor:String){repository(owner:"kaalakhatta",name:"AGRIRAKSHAK"){pullRequest(number:$number){reviewThreads(first:100,after:$cursor){nodes{isResolved}pageInfo{hasNextPage endCursor}}}}}';
    const params = ['api','graphql','-f',`query=${query}`,'-F',`number=${number}`];
    if (cursor) params.push('-f',`cursor=${cursor}`);
    const response = JSON.parse(gh(params));
    requireValue(!response.errors, 'Review-thread verification failed.');
    const data = response.data.repository.pullRequest.reviewThreads;
    threads.push(...data.nodes); cursor = data.pageInfo.hasNextPage ? data.pageInfo.endCursor : null;
  } while(cursor);
  const result = eligibility({registry,actor,pr,threads,
    permission:api(`repos/${REPO}/collaborators/${encodeURIComponent(actor)}/permission`).permission,
    issue:api(`repos/${REPO}/issues/${task.issue}`),
    comments:pages(`repos/${REPO}/issues/${task.issue}/comments?per_page=100`),
    files:pages(`repos/${REPO}/pulls/${number}/files?per_page=100`),
    checks:pages(`repos/${REPO}/commits/${pr.head.sha}/check-runs?filter=latest&per_page=100`,'check_runs'),
    reviews:pages(`repos/${REPO}/pulls/${number}/reviews?per_page=100`),
    comparison:api(`repos/${REPO}/compare/${base}...${pr.head.sha}`).status
  });
  requireValue(api(`repos/${REPO}/git/ref/heads/main`).object.sha === base && api(`repos/${REPO}/pulls/${number}`).head.sha === result.head, 'Main or the PR head changed during verification. Reconcile, rerun checks and retry.');
  console.log(`Eligible: Task ${result.task}, PR #${number}, head ${result.head}.`);
  if (args[1] === '--check') return;
  gh(['pr','merge',String(number),'--repo',REPO,'--merge','--match-head-commit',result.head]);
  const merged = api(`repos/${REPO}/pulls/${number}`);
  requireValue(merged.merged === true, 'Merge was not confirmed. Inspect GitHub; do not report success.');
  console.log(`Merged PR #${number}: ${merged.merge_commit_sha}`);
}
if (require.main === module) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode=1; });
module.exports = { eligibility, REQUIRED_CHECKS };
