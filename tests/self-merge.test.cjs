const test = require('node:test');
const assert = require('node:assert/strict');
const { eligibility, REQUIRED_CHECKS } = require('../.github/scripts/self-merge.cjs');
const registry = require('../docs/farm-context/tasks.json');
function fixture(contributor='Yashi') {
  const task=registry.tasks.find(task=>task.contributor===contributor), actor=registry.contributors[contributor], head='a'.repeat(40);
  const filename=task.paths.includes('*')?'AGENTS.md':`${task.paths.find(path=>path.endsWith('/'))}fixture.md`;
  return {registry,actor,permission:'write',pr:{state:'open',draft:false,merged:false,base:{ref:'main',repo:{full_name:'kaalakhatta/AGRIRAKSHAK'}},head:{ref:task.branch,sha:head},user:{login:actor},body:`Refs #${task.issue}\nSelf-review: complete`,changed_files:1,mergeable:true,mergeable_state:'clean'},issue:{state:'open',assignees:[{login:actor}]},comments:[{user:{type:'Bot',login:'github-actions[bot]'},body:`Claim confirmed for @${actor}: Task ${task.task}.`}],files:[{filename}],checks:REQUIRED_CHECKS.map(name=>({name,app:{slug:'github-actions'},head_sha:head,status:'completed',conclusion:'success'})),reviews:[],threads:[],comparison:'ahead'};
}
test('each registered author may merge only their own claimed, scoped, reviewed and checked head',()=>{
  for(const task of registry.tasks){const f=fixture(task.contributor);assert.deepEqual(eligibility(f),{head:f.pr.head.sha,task:task.task,issue:task.issue});}
  const f=fixture();f.actor=f.actor.toUpperCase();assert.ok(eligibility(f));
});
test('foreign author/account/branch, closed/draft PR, wrong target and insufficient permission fail',()=>{
  for(const change of [f=>f.actor='outsider',f=>f.pr.user.login='outsider',f=>f.pr.head.ref='docs/legacy',f=>f.pr.state='closed',f=>f.pr.draft=true,f=>f.pr.base.ref='other',f=>f.pr.base.repo.full_name='other/repo',f=>f.permission='read']){const f=fixture();change(f);assert.throws(()=>eligibility(f));}
});
test('assigned issue alone, spoofed confirmation, released/foreign claims and missing review/task linkage fail',()=>{
  for(const change of [f=>f.comments=[],f=>f.comments[0].user.type='User',f=>f.comments[0].user.login='fake-bot',f=>f.issue.assignees=[],f=>f.issue.assignees[0].login='other',f=>f.issue.state='closed',f=>f.pr.body='Refs #10',f=>f.pr.body='Self-review: complete']){const f=fixture();change(f);assert.throws(()=>eligibility(f));}
});
test('outside paths, both rename sides, traversal and incomplete file pagination reject',()=>{
  for(const change of [f=>f.files[0].filename='apps/web/page.tsx',f=>f.files[0].previous_filename='apps/web/page.tsx',f=>f.files[0].filename='docs/research/../secret',f=>f.pr.changed_files=2,f=>f.files=[]]){const f=fixture();change(f);assert.throws(()=>eligibility(f));}
});
test('missing, failed, skipped, pending, foreign-app, duplicate and stale-head checks reject',()=>{
  for(const change of [f=>f.checks.pop(),f=>f.checks[0].conclusion='failure',f=>f.checks[0].conclusion='skipped',f=>f.checks[0].status='in_progress',f=>f.checks[0].app.slug='other',f=>f.checks.push({...f.checks[0]}),f=>f.checks[0].head_sha='b'.repeat(40),f=>f.checks.push({...f.checks[0],name:'extra',conclusion:'failure'})]){const f=fixture();change(f);assert.throws(()=>eligibility(f));}
});
test('stale main, conflicts, unknown mergeability, requested changes and unresolved discussions block',()=>{
  for(const change of [f=>f.comparison='diverged',f=>f.pr.mergeable=false,f=>f.pr.mergeable=null,f=>f.pr.mergeable_state='blocked',f=>f.reviews=[{user:{login:'reviewer'},state:'CHANGES_REQUESTED'}],f=>f.threads=[{isResolved:false}]]){const f=fixture();change(f);assert.throws(()=>eligibility(f));}
  const f=fixture();f.reviews=[{user:{login:'reviewer'},state:'CHANGES_REQUESTED'},{user:{login:'reviewer'},state:'COMMENTED'}];assert.throws(()=>eligibility(f));f.reviews.push({user:{login:'reviewer'},state:'APPROVED'});f.threads=[{isResolved:true}];assert.ok(eligibility(f));
});
