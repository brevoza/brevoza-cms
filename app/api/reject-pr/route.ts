import { NextResponse } from 'next/server';
import { App } from 'octokit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { owner, repo, prNumber } = body;

    if (!owner || !repo || !prNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo, prNumber' },
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

    // Close the pull request
    await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
      state: 'closed',
    });

    return NextResponse.json({
      success: true,
      message: 'Pull request rejected and closed',
    });
  } catch (error) {
    console.error('Error rejecting PR:', error);
    
    let errorMessage = 'Failed to reject PR';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if ('status' in error) {
        const status = (error as any).status;
        if (status === 404) {
          errorMessage = 'PR not found.';
        }
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
