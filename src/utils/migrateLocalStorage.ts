/**
 * Migration utility to handle localStorage key changes
 */

export function migrateLocalStorageKeys() {
  try {
    // Migration for token key change from 'token' to 'kanban-token'
    const oldToken = localStorage.getItem('token');
    const newToken = localStorage.getItem('kanban-token');
    
    if (oldToken && !newToken) {
      // Migrate old token to new key
      localStorage.setItem('kanban-token', oldToken);
      localStorage.removeItem('token');
      console.log('Migrated token from "token" to "kanban-token"');
    }
    
    // Migration for user key - ensure consistency 
    const oldUser = localStorage.getItem('user');
    const newUser = localStorage.getItem('kanban-user');
    
    if (oldUser && !newUser) {
      // Migrate old user to new key
      localStorage.setItem('kanban-user', oldUser);
      localStorage.removeItem('user');
      console.log('Migrated user from "user" to "kanban-user"');
    }
    
    // Clear any invalid or orphaned tokens
    const token = localStorage.getItem('kanban-token');
    const user = localStorage.getItem('kanban-user');
    
    if (token && !user) {
      // Token exists but no user - clear the token
      localStorage.removeItem('kanban-token');
      console.log('Cleared orphaned token');
    }
    
    if (user && !token) {
      // User exists but no token - clear the user
      localStorage.removeItem('kanban-user');
      console.log('Cleared orphaned user');
    }
    
  } catch (error) {
    console.error('Error during localStorage migration:', error);
  }
}

/**
 * Clear all authentication data (for logout or reset)
 */
export function clearAuthData() {
  try {
    localStorage.removeItem('kanban-token');
    localStorage.removeItem('kanban-user');
    localStorage.removeItem('token'); // Clean up any old keys
    localStorage.removeItem('user');  // Clean up any old keys
    console.log('Cleared all authentication data');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
} 