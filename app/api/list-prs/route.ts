import { NextResponse } from 'next/server';
import { App } from 'octokit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const state = searchParams.get('state') || 'open';

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo' },
        { status: 400 }
      );
    }

    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY;

    if (!appId || !privateKey) {
      return NextResponse.json(
        { error: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    // Initialize GitHub App
    const app = new App({
      appId,
      privateKey,
    });

    // Get the installation for this repository
    const { data: installations } = await app.octokit.request('GET /app/installations');
    
    if (installations.length === 0) {
      return NextResponse.json(
        { error: 'No installations found for this GitHub App' },
        { status: 500 }
      );
    }

    // Find the installation for the specific owner
    const installation = installations.find(
      (inst) => inst.account?.login.toLowerCase() === owner.toLowerCase()
    );

    if (!installation) {
      return NextResponse.json(
        { error: `GitHub App is not installed on account: ${owner}` },
        { status: 500 }
      );
    }

    const installationId = installation.id;
    const octokit = await app.getInstallationOctokit(installationId);

    // List pull requests
    const { data: pullRequests } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: state as 'open' | 'closed' | 'all',
      sort: 'created',
      direction: 'desc',
      per_page: 100,
    });

    return NextResponse.json({
      success: true,
      pullRequests,
    });
  } catch (error) {
    console.error('Error listing PRs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list PRs' },
      { status: 500 }
    );
  }
}
