export type BrevozaConfigResult = {
  content?: string;
  error?: string;
  url?: string;
};

export type CollectionEntry = {
  name: string;
  config?: string;
};

export async function fetchBrevozaConfig(): Promise<BrevozaConfigResult> {
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  const branch = process.env.REPO_BRANCH ?? "main";

  if (!owner || !repo) {
    return { error: "Missing REPO_OWNER or REPO_NAME environment variables." };
  }

  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/brevoza.config.yml`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { error: `Failed to fetch file: ${res.status} ${res.statusText}`, url };
    }
    const text = await res.text();
    return { content: text, url };
  } catch (err) {
    return { error: String(err), url };
  }
}

export function parseCollectionsFromConfig(content: string): CollectionEntry[] {
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  const colIdx = lines.findIndex((l) => l.trim() === "collections:");
  if (colIdx === -1) return [];

  const entries: CollectionEntry[] = [];
  let currentName: string | null = null;

  for (let i = colIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    // stop if next top-level key
    if (/^[^\s]/.test(line)) break;

    const nameMatch = line.match(/^\s{2,}([^\s:]+):\s*$/);
    if (nameMatch) {
      currentName = nameMatch[1];
      entries.push({ name: currentName });
      continue;
    }

    if (currentName) {
      const configMatch = line.match(/^\s{4,}config:\s*(?:"|')?([^"'\s]+)(?:"|')?\s*$/);
      if (configMatch) {
        const last = entries[entries.length - 1];
        if (last) last.config = configMatch[1];
      }

      // Also support inline `config:` directly under 2 spaces: e.g. `  projects: { config: file }`
      const inlineMatch = line.match(/config:\s*(?:"|')?([^"'\s]+)(?:"|')?/);
      if (inlineMatch) {
        const last = entries[entries.length - 1];
        if (last && !last.config) last.config = inlineMatch[1];
      }
    }
  }

  return entries;
}

export async function fetchFileAtPath(path: string): Promise<BrevozaConfigResult> {
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  const branch = process.env.REPO_BRANCH ?? "main";

  if (!owner || !repo) {
    return { error: "Missing REPO_OWNER or REPO_NAME environment variables." };
  }

  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { error: `Failed to fetch file: ${res.status} ${res.statusText}`, url };
    }
    const text = await res.text();
    return { content: text, url };
  } catch (err) {
    return { error: String(err), url };
  }
}

export async function fetchCollectionConfig(collectionName: string): Promise<BrevozaConfigResult> {
  const brevoza = await fetchBrevozaConfig();
  if (brevoza.error) return { error: brevoza.error };
  const collections = parseCollectionsFromConfig(brevoza.content ?? "");
  const entry = collections.find((c) => c.name === collectionName);
  if (!entry) return { error: `Collection '${collectionName}' not found in brevoza.config.yml` };
  if (!entry.config) return { error: `Collection '${collectionName}' has no 'config' file configured.` };

  return fetchFileAtPath(entry.config);
}
