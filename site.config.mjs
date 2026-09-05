const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
export const basePath =
  process.env.BASE_PATH ??
  (repo && !repo.endsWith('.github.io') ? `/${repo}` : '');
if (basePath !== '' && !/^\/[A-Za-z0-9._-]+$/.test(basePath))
  throw new Error('BASE_PATH must be empty or one safe repository segment.');
