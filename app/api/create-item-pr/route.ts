import { NextResponse } from 'next/server';
import { getOctokitForOwner } from '../../lib/github';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Required parameters
    const { owner, repo, collectionName, itemData, itemPath } = body;
    
    if (!owner || !repo || !collectionName || !itemData || !itemPath) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo, collectionName, itemData, itemPath' },
        { status: 400 }
      );
    }

    // Optional parameter with fallback
    const timestamp = Date.now();
    const branchName = body.branchName || `add-${collectionName}-item-${timestamp}`;
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

    // Convert itemData to JSON string with proper formatting
    const fileContent = JSON.stringify(itemData, null, 2);

    // Create the new file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: itemPath,
      message: `Add new ${collectionName} item: ${itemData.id || itemData.name || 'new-item'}`,
      content: Buffer.from(fileContent).toString('base64'),
      branch: branchName,
    });

    // Create pull request
    const prTitle = `Add new ${collectionName}: ${itemData.id || itemData.name || 'new-item'}`;
    const prBody = `This PR adds a new item to the **${collectionName}** collection.\n\n**File:** \`${itemPath}\`\n\n**Data:**\n\`\`\`json\n${fileContent}\n\`\`\``;

    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: prTitle,
      head: branchName,
      base: baseBranch,
      body: prBody,
    });

    return NextResponse.json({
      success: true,
      url: pr.html_url,
      number: pr.number,
      branchName,
      itemPath,
    });
  } catch (error) {
    console.error('Error creating item PR:', error);
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to create PR';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific GitHub API errors
      if ('status' in error) {
        const status = (error as any).status;
        if (status === 422) {
          errorMessage = 'File already exists or branch name conflict. Try a different item ID.';
        } else if (status === 404) {
          errorMessage = 'Repository not found or app does not have access.';
        }
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
