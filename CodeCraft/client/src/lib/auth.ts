import { create } from 'zustand';
import { apiRequest } from './queryClient';
import { User } from './types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isVisitor: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  continueAsVisitor: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isVisitor: false,
  isLoading: true,
  error: null,
  
  login: async (username: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('Attempting to log in with username:', username);
      
      // Add comprehensive error handling for debugging
      try {
        // Check if we need to use a different endpoint based on server routes
        let loginEndpoint = '/api/auth/login';
        
        // Debug info
        console.log(`Using login endpoint: ${loginEndpoint}`);
        console.log(`Sending credentials: username=${username}, password length=${password.length}`);
        
        const user = await apiRequest('POST', loginEndpoint, { username, password });
        console.log('Login successful, user data:', user);
        set({ user, isAuthenticated: true, isLoading: false });
      } catch (apiError: any) {
        console.error('API request error details:', {
          message: apiError.message,
          status: apiError.status,
          data: apiError.data
        });
        throw apiError;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      const user = await apiRequest('POST', '/api/auth/register', userData);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      set({ isLoading: true });
      await apiRequest('POST', '/api/auth/logout');
      set({ user: null, isAuthenticated: false, isVisitor: false, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  continueAsVisitor: () => {
    console.log('Switching to visitor mode');
    set({ 
      user: {
        id: -1, // Using -1 as a special ID for visitor
        username: 'visitor',
        email: 'visitor@example.com',
        fullName: 'Guest User',
        role: 'freelancer' as const,
        status: 'active' as const,
        profilePicture: '/uploads/profiles/default-avatar.png',
        bio: 'Browsing in visitor mode',
        createdAt: new Date()
      }, 
      isAuthenticated: false, 
      isVisitor: true, 
      isLoading: false, 
      error: null 
    });
    console.log('Visitor mode enabled');
  },
  
  checkAuth: async () => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      console.log('Checking authentication status...');
      
      try {
        // Try to get user data from the API
        console.log('Checking auth with /api/auth/me endpoint');
        const user = await apiRequest('GET', '/api/auth/me');
        console.log('Auth check result:', user ? 'Authenticated' : 'Not authenticated');
        
        if (user) {
          console.log('User data received:', user);
          set({ 
            user,
            isAuthenticated: true,
            isVisitor: false,
            isLoading: false,
            error: null
          });
        } else {
          console.log('No user data returned, setting to unauthenticated state');
          set({ 
            user: null,
            isAuthenticated: false,
            isVisitor: false,
            isLoading: false,
            error: null
          });
        }
      } catch (apiError: any) {
        // Handle 401 gracefully - not an error, just not authenticated
        if (apiError.status === 401) {
          console.log('401 Unauthorized, user not logged in');
          set({ 
            user: null,
            isAuthenticated: false,
            isVisitor: false,
            isLoading: false,
            error: null
          });
          return; // Don't rethrow, this is an expected state
        }
        
        console.error('API request error details:', {
          message: apiError.message,
          status: apiError.status,
          data: apiError.data
        });
        
        // Only throw for unexpected errors
        throw apiError;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      set({ 
        user: null,
        isAuthenticated: false,
        isVisitor: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed'
      });
    }
  }
}));
