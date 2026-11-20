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

const repo = 'tdavor/Vastkustbus';
export const latestReleaseUrl = `https://api.github.com/repos/${repo}/releases/latest`;

export function availableAPK(installed: string, response: unknown) {
  if (!response || typeof response !== 'object') return;
  const release = response as Record<string, unknown>;
  const tag = release.tag_name;
  if (typeof tag !== 'string' || !tag.startsWith('v') || release.draft !== false || release.prerelease !== false) return;
  const version = newerVersion(installed, [{ name: tag }]);
  if (!version || !Array.isArray(release.assets)) return;
  const filename = `Vastkustbus-${tag}.apk`;
  const url = `https://github.com/${repo}/releases/download/${tag}/${filename}`;
  const asset = release.assets.find(item => item?.name === filename && item.browser_download_url === url);
  if (asset?.state !== 'uploaded' || !Number.isSafeInteger(asset.size) || asset.size <= 0 || asset.size > 120 * 1024 * 1024
    || typeof asset.digest !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(asset.digest)) return;
  return { version, filename, url, size: asset.size as number, sha256: asset.digest.slice(7) as string };
}
