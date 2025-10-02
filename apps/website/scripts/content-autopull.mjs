#!/usr/bin/env node

/**
 * Content Auto-Puller for Development
 * 
 * Periodically fetches and rebases content from GitHub to keep local
 * development environment in sync with the remote repository.
 * 
 * This script runs in the background during development to ensure
 * that content changes made through Decap CMS are available locally
 * without manual intervention.
 */

import { execSync } from 'node:child_process';

const INTERVAL_MS = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

// Configuration
const GITHUB_OWNER = 'dmitrybond-tech';
const GITHUB_REPO = 'personal-website-dev';
const GITHUB_BRANCH = 'main';
const REMOTE_NAME = 'origin';

// Paths to monitor for changes
const CONTENT_PATHS = [
  'apps/website/src/content/posts',
  'apps/website/src/content/pages',
  'apps/website/public/uploads',
];

let isRunning = false;
let retryCount = 0;
let repoRoot = null;

// Determine repository root and change to it
try {
  repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: 'pipe' }).trim();
  process.chdir(repoRoot);
  console.log(`[AUTOPULL] repo root: ${repoRoot}`);
} catch {
  console.log('[AUTOPULL] Not in a git repository (rev-parse failed), skipping...');
  process.exit(0);
}

/**
 * Execute a git command and return the result
 */
function execGit(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || ''
    };
  }
}


/**
 * Get the current branch name
 */
function getCurrentBranch() {
  const result = execGit('git rev-parse --abbrev-ref HEAD');
  return result.success ? result.output : null;
}

/**
 * Check if there are uncommitted changes
 */
function hasUncommittedChanges() {
  const result = execGit('git status --porcelain');
  return result.success && result.output.length > 0;
}

/**
 * Fetch latest changes from remote
 */
function fetchFromRemote() {
  const result = execGit(`git fetch ${REMOTE_NAME} ${GITHUB_BRANCH}`);
  
  if (!result.success) {
    console.error(`[AUTOPULL] Fetch failed:`, result.error);
    return false;
  }
  
  return true;
}

/**
 * Check if there are new commits to pull
 */
function hasNewCommits() {
  const result = execGit(`git rev-list --count HEAD..${REMOTE_NAME}/${GITHUB_BRANCH}`);
  
  if (!result.success) {
    console.error(`[AUTOPULL] Failed to check for new commits:`, result.error);
    return false;
  }
  
  const commitCount = parseInt(result.output, 10);
  return commitCount > 0;
}

/**
 * Perform a rebase to get latest changes
 */
function rebaseLatest() {
  const result = execGit(`git rebase ${REMOTE_NAME}/${GITHUB_BRANCH}`);
  
  if (!result.success) {
    console.error(`[AUTOPULL] Rebase failed:`, result.error);
    console.error(`[AUTOPULL] Stderr:`, result.stderr);
    return false;
  }
  
  return true;
}

/**
 * Check if any content paths have changed
 */
function hasContentChanges() {
  const result = execGit(`git diff --name-only HEAD~1 HEAD`);
  
  if (!result.success) {
    return false;
  }
  
  const changedFiles = result.output.split('\n').filter(Boolean);
  return CONTENT_PATHS.some(path => 
    changedFiles.some(file => file.startsWith(path))
  );
}

/**
 * Main auto-pull logic
 */
async function autoPull() {
  if (isRunning) {
    console.log(`[AUTOPULL] Previous operation still running, skipping...`);
    return;
  }
  
  isRunning = true;
  
  try {
    // Check current branch
    const currentBranch = getCurrentBranch();
    if (currentBranch !== GITHUB_BRANCH) {
      console.log(`[AUTOPULL] Not on ${GITHUB_BRANCH} branch (current: ${currentBranch}), skipping...`);
      return;
    }
    
    // Check for uncommitted changes
    if (hasUncommittedChanges()) {
      console.log(`[AUTOPULL] Uncommitted changes detected, skipping auto-pull...`);
      return;
    }
    
    // Fetch latest changes
    if (!fetchFromRemote()) {
      throw new Error('Failed to fetch from remote');
    }
    
    // Check if there are new commits
    if (!hasNewCommits()) {
      // No new commits, nothing to do
      return;
    }
    
    console.log(`[AUTOPULL] New commits detected, applying changes...`);
    
    // Perform rebase
    if (!rebaseLatest()) {
      throw new Error('Failed to rebase');
    }
    
    console.log(`[AUTOPULL] Content changes applied successfully`);
    
    // Reset retry count on success
    retryCount = 0;
    
  } catch (error) {
    console.error(`[AUTOPULL] Error:`, error?.message || error);
    retryCount++;
    
    if (retryCount >= MAX_RETRIES) {
      console.error(`[AUTOPULL] Max retries (${MAX_RETRIES}) reached, stopping auto-pull`);
      process.exit(1);
    }
    
    console.log(`[AUTOPULL] Retrying in ${RETRY_DELAY_MS}ms... (attempt ${retryCount}/${MAX_RETRIES})`);
    setTimeout(() => {
      isRunning = false;
      autoPull();
    }, RETRY_DELAY_MS);
    
    return; // Don't reset isRunning here since we're scheduling a retry
  } finally {
    isRunning = false;
  }
}

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown() {
  const shutdown = () => {
    console.log(`[AUTOPULL] Shutting down gracefully...`);
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGHUP', shutdown);
}

/**
 * Main entry point
 */
function main() {
  console.log(`[AUTOPULL] Starting content auto-puller...`);
  
  setupGracefulShutdown();
  
  // Run immediately on startup
  autoPull();
  
  // Then run on interval
  setInterval(autoPull, INTERVAL_MS);
}

// Start the auto-puller
main();
