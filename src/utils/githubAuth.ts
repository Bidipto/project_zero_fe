/**
 * GitHub OAuth utility functions
 */

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

/**
 * Generate a random state parameter for OAuth security
 */
export function generateOAuthState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Store OAuth state in localStorage
 */
export function storeOAuthState(state: string): void {
  localStorage.setItem('github_oauth_state', state);
}

/**
 * Get stored OAuth state from localStorage
 */
export function getStoredOAuthState(): string | null {
  return localStorage.getItem('github_oauth_state');
}

/**
 * Clear stored OAuth state from localStorage
 */
export function clearOAuthState(): void {
  localStorage.removeItem('github_oauth_state');
}

/**
 * Construct GitHub OAuth authorization URL
 */
export function getGitHubAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user:email',
    state: state
  });
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Validate OAuth state parameter
 */
export function validateOAuthState(receivedState: string, storedState: string | null): boolean {
  return storedState !== null && receivedState === storedState;
}

/**
 * Get GitHub user profile using access token
 */
export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Project-Zero-App'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub user: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get GitHub user emails using access token
 */
export async function getGitHubEmails(accessToken: string): Promise<any[]> {
  const response = await fetch('https://api.github.com/user/emails', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Project-Zero-App'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub emails: ${response.statusText}`);
  }

  return response.json();
} 