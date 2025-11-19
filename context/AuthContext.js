import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [theme, setTheme] = useState('light');
  const language = 'fr'; // French only

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Initialize session and set up auth listener
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        console.log('📱 Platform:', Platform.OS || 'unknown');
        
        // Get the current session from Supabase (will use localStorage on web)
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
        }

        console.log('📦 Session data:', currentSession ? 'EXISTS' : 'NULL');
        if (currentSession) {
          console.log('📧 Email:', currentSession.user.email);
          console.log('🔑 Access Token:', currentSession.access_token ? 'EXISTS' : 'MISSING');
          console.log('🔄 Refresh Token:', currentSession.refresh_token ? 'EXISTS' : 'MISSING');
        }

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }

        // Log session info for debugging
        if (currentSession) {
          console.log('✅ Session restored successfully!');
          console.log('👤 User:', currentSession.user.email);
          console.log('⏰ Expires at:', new Date(currentSession.expires_at * 1000).toLocaleString());
        } else {
          console.log('❌ No active session found - showing login screen');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔄 Auth state changed:', event);
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }

        // Handle different auth events
        switch (event) {
          case 'INITIAL_SESSION':
            console.log('🔑 Initial session check');
            break;
          case 'SIGNED_IN':
            console.log('✅ User signed in:', currentSession?.user?.email);
            break;
          case 'SIGNED_OUT':
            console.log('👋 User signed out');
            // Clear any additional cached data if needed
            break;
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            break;
          case 'USER_UPDATED':
            console.log('📝 User updated');
            break;
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Enhanced sign in with better error handling
  const signIn = async (credentials) => {
    try {
      console.log('🔐 Attempting sign in...');
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      
      if (error) throw error;

      // Session is automatically stored in AsyncStorage by Supabase
      console.log('✅ Sign in successful:', data.user.email);
      console.log('💾 Session will be persisted');
      
      return { data, error: null };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { data: null, error };
    }
  };

  // Enhanced sign out with cleanup
  const signOut = async () => {
    try {
      console.log('👋 Attempting sign out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      // Clear session state
      setSession(null);
      setUser(null);
      
      console.log('✅ Sign out successful');
      
      return { error: null };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { error };
    }
  };

  // Check if session is valid and not expired
  const isSessionValid = () => {
    if (!session) return false;
    
    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    
    return expiresAt > now;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isSessionValid,
    theme,
    toggleTheme,
    language,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};