export type BrevozaConfigResult = {
  content?: string;
  error?: string;
  url?: string;
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
