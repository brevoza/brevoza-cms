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

    // Merge the pull request
    const { data: mergeResult } = await octokit.rest.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      merge_method: 'merge',
    });

    return NextResponse.json({
      success: true,
      merged: mergeResult.merged,
      message: mergeResult.message,
    });
  } catch (error) {
    console.error('Error approving PR:', error);
    
    let errorMessage = 'Failed to approve PR';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if ('status' in error) {
        const status = (error as any).status;
        if (status === 405) {
          errorMessage = 'PR cannot be merged. Check if there are conflicts or required status checks.';
        } else if (status === 404) {
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
