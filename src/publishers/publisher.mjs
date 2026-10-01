export function isDryRun(env = process.env) { return String(env.DRY_RUN ?? 'true').toLocaleLowerCase() !== 'false'; }

export async function publish({ adapter = 'ftp', payload, env = process.env, transport }) {
  if (isDryRun(env)) return { status: 'preview_only', adapter, remoteChanged: false, message: 'DRY_RUN blocked remote publication.' };
  if (!transport) throw new Error('A controlled transport adapter is required outside dry-run mode.');
  return transport({ adapter, payload });
}

export async function notifyGoogleIndexing({ url, env = process.env, request }) {
  if (isDryRun(env)) return { status: 'skipped', remoteChanged: false, message: 'DRY_RUN blocked Google Indexing.' };
  if (!request) throw new Error('A controlled indexing adapter is required outside dry-run mode.');
  return request(url);
}
