function parseVersion(tag: string) {
  const match = /^v?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.exec(tag);
  if (!match) return;
  const parts = match.slice(1).map(Number);
  if (parts.every(Number.isSafeInteger)) return parts;
}

function compare(a: number[], b: number[]) {
  return (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]);
}

export function newerVersion(installed: string, response: unknown): string | undefined {
  const current = parseVersion(installed);
  if (!current || !Array.isArray(response)) return;
  let latest = current;
  for (const tag of response) {
    const name = tag?.name;
    const version = typeof name === 'string' ? parseVersion(name) : undefined;
    if (version && compare(version, latest) > 0) latest = version;
  }
  if (latest !== current) return latest.join('.');
}
