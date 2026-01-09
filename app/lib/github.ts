import { App } from 'octokit';
import type { Octokit } from 'octokit';

export type GitHubAppError = {
  error: string;
  status: number;
};

/**
 * Initializes the GitHub App and returns an authenticated Octokit instance
 * for the specified owner's installation.
 * 
 * @param owner - The GitHub account/organization name
 * @returns Octokit instance or error object
 */
export async function getOctokitForOwner(owner: string): Promise<
  { octokit: Octokit } | GitHubAppError
> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    return {
      error: 'Missing required environment variables: GITHUB_APP_ID or GITHUB_PRIVATE_KEY',
      status: 500,
    };
  }

  try {
    // Initialize GitHub App
    const app = new App({
      appId,
      privateKey,
    });

    // Get all installations
    const { data: installations } = await app.octokit.request('GET /app/installations');
    
    if (installations.length === 0) {
      return {
        error: 'No installations found for this GitHub App',
        status: 500,
      };
    }

    // Find the installation for the specific owner
    const installation = installations.find(
      (inst) => inst.account?.login.toLowerCase() === owner.toLowerCase()
    );

    if (!installation) {
      return {
        error: `GitHub App is not installed on account: ${owner}`,
        status: 403,
      };
    }

    // Get authenticated Octokit instance for this installation
    const octokit = await app.getInstallationOctokit(installation.id);

    return { octokit };
  } catch (error) {
    console.error('Error initializing GitHub App:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to initialize GitHub App',
      status: 500,
    };
  }
}
