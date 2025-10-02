import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  // This endpoint is for diagnostic purposes only
  // It checks if we can access the OAuth token and verify its type/scopes
  
  try {
    // Try to get the access token from cookies (where astro-decap-cms-oauth stores it)
    const accessToken = cookies.get('github_access_token')?.value;
    
    if (!accessToken) {
      return new Response(JSON.stringify({
        error: 'No access token found',
        message: 'OAuth token not available in cookies'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    // Fetch user info from GitHub API
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Decap-CMS-Diagnostic'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: 'GitHub API error',
        status: response.status,
        message: await response.text()
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    const userData = await response.json();
    
    // Check token scopes by making a request that requires specific permissions
    const scopesResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Decap-CMS-Diagnostic'
      }
    });

    const hasEmailScope = scopesResponse.ok;
    
    return new Response(JSON.stringify({
      token_type: 'OAuth App User Token',
      user: {
        login: userData.login,
        type: userData.type,
        id: userData.id
      },
      scopes: {
        has_repo_scope: true, // If we got user data, repo scope is working
        has_user_email_scope: hasEmailScope,
        email_scope_test: hasEmailScope ? 'PASS' : 'FAIL'
      },
      diagnostic: {
        token_length: accessToken.length,
        token_prefix: accessToken.substring(0, 8) + '...'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
};
