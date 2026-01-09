import { NextResponse } from 'next/server';
import { getOctokitForOwner } from '../../lib/github';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Required parameters
    const { owner, repo, filePath, content, title, prBody, commitMessage } = body;
    
    if (!owner || !repo || !filePath || !content || !title || !prBody || !commitMessage) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo, filePath, content, title, prBody, commitMessage' },
        { status: 400 }
      );
    }

    // Optional parameter with fallback
    const timestamp = Date.now();
    const branchName = body.branchName || `proposal-${timestamp}`;
    const baseBranch = body.baseBranch || 'main';

    const result = await getOctokitForOwner(owner);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { octokit } = result;

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
