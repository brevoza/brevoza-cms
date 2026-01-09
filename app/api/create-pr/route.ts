import { NextResponse } from 'next/server';
import { App } from 'octokit';

export async function POST() {
  try {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY;
    const owner = process.env.REPO_OWNER;
    const repo = process.env.REPO_NAME;
    const branch = process.env.REPO_BRANCH || 'main';

    if (!appId || !privateKey || !owner || !repo) {
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

    // Create a unique branch name
    const timestamp = Date.now();
    const newBranch = `proposal-${timestamp}`;

    // Get the base branch SHA
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const baseSha = refData.object.sha;

    // Create new branch
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha: baseSha,
    });

    // Get current README content
    const { data: readmeData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'README.md',
      ref: newBranch,
    });

    if ('content' in readmeData) {
      // Decode the content
      const currentContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      const newContent = currentContent + '\nPR opened by beroza';

      // Update the README
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: 'README.md',
        message: 'Update README - PR opened by beroza',
        content: Buffer.from(newContent).toString('base64'),
        sha: readmeData.sha,
        branch: newBranch,
      });

      // Create pull request
      const { data: pr } = await octokit.rest.pulls.create({
        owner,
        repo,
        title: 'Proposal: Update README',
        head: newBranch,
        base: branch,
        body: 'This PR was automatically created from the proposals page.\n\nAdds "PR opened by beroza" to the README.',
      });

      return NextResponse.json({
        success: true,
        url: pr.html_url,
        number: pr.number,
      });
    } else {
      return NextResponse.json(
        { error: 'README.md not found or is a directory' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating PR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create PR' },
      { status: 500 }
    );
  }
}
