// Registry entries ending in / are directory scopes; all others are exact files.
function isAllowedPath(paths, filename) {
  if (typeof filename !== 'string' || !filename || filename.startsWith('/') || filename.includes('\\') || filename.split('/').some(part => part === '..' || part === '.' || part === '')) return false;
  return paths.some(scope => scope === '*' || (scope.endsWith('/') ? filename.startsWith(scope) : filename === scope));
}
module.exports = { isAllowedPath };
