import { NextResponse } from 'next/server';
import { getOctokitForOwner } from '../../lib/github';

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

    const result = await getOctokitForOwner(owner);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { octokit } = result;

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
