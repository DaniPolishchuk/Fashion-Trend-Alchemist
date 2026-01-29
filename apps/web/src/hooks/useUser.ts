/**
 * useUser Hook
 * Manages user authentication state and information
 * Automatically switches between XSUAA user data (deployed) and mock data (local)
 */

import { useState, useEffect } from 'react';
import { fetchUserInfo } from '../services/api/user';

export interface User {
  name: string;
  email: string;
  initials: string;
  id: string;
}

/**
 * Generate user initials from full name
 * Examples: "John Doe" -> "JD", "Alice" -> "A", "Bob Smith Johnson" -> "BS"
 */
function generateInitials(name: string): string {
  if (!name || typeof name !== 'string') return '??';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

  // Take first letter of first name and first letter of last name
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Custom hook to manage user state
 * Fetches user info on mount and provides user data with initials
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfo = await fetchUserInfo();

        if (userInfo) {
          setUser({
            name: userInfo.name,
            email: userInfo.email,
            id: userInfo.id,
            initials: generateInitials(userInfo.name),
          });
        } else {
          // No authenticated user (local development)
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, []);

  return { user, loading };
}
