/**
 * User API Client
 * Handles user information fetching from the backend
 */

import { fetchAPI } from './client';

export interface UserInfo {
  name: string;
  email: string;
  id: string;
}

export interface UserInfoResponse {
  authenticated: boolean;
  user: UserInfo | null;
}

/**
 * Fetch current user information
 * In deployed environments with XSUAA, returns authenticated user data
 * In local development, returns null (frontend will use mock data)
 */
export async function fetchUserInfo(): Promise<UserInfo | null> {
  try {
    const result = await fetchAPI<UserInfoResponse>('/api/user/info');

    if (result.data?.authenticated && result.data.user) {
      return result.data.user;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    return null;
  }
}
