async function claim({ github, context, registry }) {
  const payload = context.payload;
  const command = payload.comment.body.trim();
  if (!['/claim', '/unclaim'].includes(command) || payload.issue.pull_request) return;
  const repo = context.repo;
  const issue_number = payload.issue.number;
  const actor = payload.comment.user.login;
  const reply = body => github.rest.issues.createComment({ ...repo, issue_number, body });
  const task = registry.tasks.find(t => t.issue === issue_number);
  if (!task) return reply('This issue is not an active registered team task. Contact Arindam.');
  const { data: issue } = await github.rest.issues.get({ ...repo, issue_number });
  if (issue.state !== 'open') return reply('This task is closed. No claim changed.');
  const expected = registry.contributors[task.contributor];
  if (!expected) return reply('GitHub account mapping is TBD. Arindam must configure it first.');
  const same = (a, b) => a.toLowerCase() === b.toLowerCase();
  const isOwner = same(actor, registry.owner);
  if (command === '/unclaim') {
    if (!isOwner && !issue.assignees.some(a => same(a.login, actor))) return reply('Only the assignee or Arindam may release this claim.');
    await github.rest.issues.removeAssignees({ ...repo, issue_number, assignees: issue.assignees.map(a => a.login) });
    return reply('Claim released. Preserve the existing task branch and document unfinished work before handoff.');
  }
  if (!same(actor, expected)) return reply(`Reserved for ${task.contributor}. Your account is not mapped to this task.`);
  const { data: permission } = await github.rest.repos.getCollaboratorPermissionLevel({ ...repo, username: actor });
  if (!['admin', 'maintain', 'write'].includes(permission.permission)) return reply('A repository collaborator with write access must claim this task.');
  if (issue.assignees.some(a => !same(a.login, actor))) return reply('Already claimed by another account. Contact Arindam; no assignment changed.');
  if (!issue.assignees.length) await github.rest.issues.addAssignees({ ...repo, issue_number, assignees: [actor] });
  return reply(`Claim confirmed for @${actor}: Task ${task.task}. Use branch \`${task.branch}\`. Allowed paths: ${task.paths.join(', ')}. One active agent/checkout for this task; resume existing branch/PR if present. Read \`${task.brief}\` before editing.`);
}
module.exports = { claim };
