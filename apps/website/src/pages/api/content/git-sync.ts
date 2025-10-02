import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';

const execAsync = promisify(exec);

export const prerender = false;

interface GitSyncRequest {
  paths: string[];
  message?: string;
}

interface GitSyncResponse {
  added: string[];
  committed: boolean;
  pushed: boolean;
  error?: string;
}

export async function POST({ request }: { request: Request }) {
  const DEV = process.env.NODE_ENV !== 'production';
  
  // Only allow in DEV mode
  if (!DEV) {
    return new Response(JSON.stringify({ error: 'Git sync only available in development' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body: GitSyncRequest = await request.json();
    const { paths, message = 'cms: content update' } = body;

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return new Response(JSON.stringify({ error: 'No paths provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find repository root
    const { stdout: repoRoot } = await execAsync('git rev-parse --show-toplevel');
    const root = repoRoot.trim();
    
    // Change to repository root
    process.chdir(root);

    // Normalize and filter paths
    const allowedPaths: string[] = [];
    const allowedPrefixes = [
      'apps/website/src/content/posts/',
      'apps/website/public/uploads/'
    ];

    for (const path of paths) {
      const normalizedPath = path.replace(/\\/g, '/');
      
      // Check if path is allowed
      const isAllowed = allowedPrefixes.some(prefix => 
        normalizedPath.startsWith(prefix)
      );
      
      if (isAllowed) {
        allowedPaths.push(normalizedPath);
      } else {
        console.warn(`[git-sync] Skipping disallowed path: ${normalizedPath}`);
      }
    }

    if (allowedPaths.length === 0) {
      return new Response(JSON.stringify({ 
        added: [], 
        committed: false, 
        pushed: false,
        error: 'No allowed paths to commit'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add files to git
    const addCommand = `git add ${allowedPaths.map(p => `"${p}"`).join(' ')}`;
    await execAsync(addCommand);

    // Check if there are changes to commit
    const { stdout: diffOutput } = await execAsync('git diff --cached --quiet; echo $?');
    const hasChanges = diffOutput.trim() !== '0';

    let committed = false;
    let pushed = false;

    if (hasChanges) {
      // Commit changes
      const commitCommand = `git commit -m "${message}"`;
      await execAsync(commitCommand);
      committed = true;

      // Pull latest changes and push
      try {
        await execAsync('git pull --rebase origin main');
        await execAsync('git push origin HEAD:main');
        pushed = true;
      } catch (pullPushError) {
        console.warn('[git-sync] Pull/push failed:', pullPushError);
        // Still return success for commit, but note push failed
      }
    }

    const response: GitSyncResponse = {
      added: allowedPaths,
      committed,
      pushed
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[git-sync] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      added: [], 
      committed: false, 
      pushed: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
