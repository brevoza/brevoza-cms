import { NextResponse } from 'next/server';
import { App } from 'octokit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Required parameters
    const { filePath, content, title, prBody, commitMessage } = body;
    
    if (!filePath || !content || !title || !prBody || !commitMessage) {
      return NextResponse.json(
        { error: 'Missing required parameters: filePath, content, title, prBody, commitMessage' },
        { status: 400 }
      );
    }

    // Optional parameter with fallback
    const timestamp = Date.now();
    const branchName = body.branchName || `proposal-${timestamp}`;

    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY;
    const owner = process.env.REPO_OWNER;
    const repo = process.env.REPO_NAME;
    const baseBranch = process.env.REPO_BRANCH || 'main';

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

    // Get the base branch SHA
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = refData.object.sha;

    // Create new branch
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Get current file content
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branchName,
    });

    if ('content' in fileData) {
      // Decode the content
      const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const newContent = currentContent + content;

      // Update the file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: commitMessage,
        content: Buffer.from(newContent).toString('base64'),
        sha: fileData.sha,
        branch: branchName,
      });

      // Create pull request
      const { data: pr } = await octokit.rest.pulls.create({
        owner,
        repo,
        title: title,
        head: branchName,
        base: baseBranch,
        body: prBody,
      });

      return NextResponse.json({
        success: true,
        url: pr.html_url,
        number: pr.number,
      });
    } else {
      return NextResponse.json(
        { error: `File '${filePath}' not found or is a directory` },
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
