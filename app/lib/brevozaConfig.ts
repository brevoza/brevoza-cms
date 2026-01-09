export type BrevozaConfigResult = {
  content?: string;
  error?: string;
  url?: string;
};

export type CollectionEntry = {
  name: string;
  config?: string;
};

export async function fetchBrevozaConfig(owner: string, repo: string, branch: string = "main"): Promise<BrevozaConfigResult> {
  if (!owner || !repo) {
    return { error: "Missing owner or repo parameters." };
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

export async function fetchFileAtPath(owner: string, repo: string, branch: string, path: string): Promise<BrevozaConfigResult> {
  if (!owner || !repo) {
    return { error: "Missing owner or repo parameters." };
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

export async function fetchCollectionConfig(owner: string, repo: string, branch: string, collectionName: string): Promise<BrevozaConfigResult> {
  const brevoza = await fetchBrevozaConfig(owner, repo, branch);
  if (brevoza.error) return { error: brevoza.error };
  const collections = parseCollectionsFromConfig(brevoza.content ?? "");
  const entry = collections.find((c) => c.name === collectionName);
  if (!entry) return { error: `Collection '${collectionName}' not found in brevoza.config.yml` };
  if (!entry.config) return { error: `Collection '${collectionName}' has no 'config' file configured.` };

  return fetchFileAtPath(owner, repo, branch, entry.config);
}

export type RepoDirEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url?: string | null;
};

export type ItemFile = {
  name: string;
  path: string;
  content?: string;
  url?: string;
  error?: string;
};

export function findItemsDirFromCollectionConfig(content?: string): string | undefined {
  if (!content) return undefined;
  // Look for common keys: items_dir, folder, path, dir
  const match = content.match(/(?:items_dir|items-directory|folder|path|dir)\s*:\s*(?:"|')?([^"'\s]+)(?:"|')?/i);
  return match ? match[1] : undefined;
}

export async function fetchRepoDirectory(owner: string, repo: string, branch: string, path: string): Promise<{ entries?: RepoDirEntry[]; error?: string; url?: string }> {
  if (!owner || !repo) return { error: "Missing owner or repo parameters." };

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;

  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (res.status === 404) return { error: `Directory not found`, url: apiUrl };
    if (!res.ok) return { error: `Failed to list directory: ${res.status} ${res.statusText}`, url: apiUrl };
    const json = await res.json();
    if (!Array.isArray(json)) return { error: `Not a directory`, url: apiUrl };
    const entries: RepoDirEntry[] = json.map((e: any) => ({ name: e.name, path: e.path, type: e.type, download_url: e.download_url }));
    return { entries, url: apiUrl };
  } catch (err) {
    return { error: String(err), url: apiUrl };
  }
}

export async function fetchAllItemsForCollection(owner: string, repo: string, branch: string, collectionName: string, collectionConfigContent?: string): Promise<{ items?: ItemFile[]; error?: string }> {
  if (!owner || !repo) return { error: "Missing owner or repo parameters." };

  // Try to discover directory from collection config
  const candidates: string[] = [];
  const fromConfig = findItemsDirFromCollectionConfig(collectionConfigContent);
  if (fromConfig) candidates.push(fromConfig);

  // common locations
  candidates.push(
    `collections/${collectionName}`,
    `${collectionName}`,
    `content/${collectionName}`,
    `data/${collectionName}`,
    `_collections/${collectionName}`
  );

  for (const candidate of candidates) {
    const listing = await fetchRepoDirectory(owner, repo, branch, candidate);
    if (listing.entries && listing.entries.length > 0) {
      // fetch each file's content (only files)
      const files = listing.entries.filter((e) => e.type === "file");
      const items: ItemFile[] = await Promise.all(
        files.map(async (f) => {
          const downloadUrl = f.download_url ?? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodeURIComponent(f.path)}`;
          try {
            const res = await fetch(downloadUrl, { cache: "no-store" });
            if (!res.ok) return { name: f.name, path: f.path, error: `Failed to fetch file: ${res.status} ${res.statusText}`, url: downloadUrl };
            const text = await res.text();
            return { name: f.name, path: f.path, content: text, url: downloadUrl };
          } catch (err) {
            return { name: f.name, path: f.path, error: String(err), url: downloadUrl };
          }
        })
      );

      return { items };
    }
    // otherwise keep trying
  }

  return { error: `No items directory found for collection '${collectionName}'` };
}
