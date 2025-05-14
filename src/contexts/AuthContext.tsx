import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { cleanupAuthState } from '@/utils/authUtils';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isRecoveryLogin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ data: { user: User } | null, error: any }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: any }>;
  resetPassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isRecoveryLogin: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ data: null, error: null }),
  signOut: async () => {},
  forgotPassword: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveryLogin, setIsRecoveryLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for recovery tokens in the URL
    const checkForRecoveryToken = () => {
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const type = searchParams.get('type');
      
      // Check both hash-based and query-based recovery indicators
      if ((hash && hash.includes('type=recovery')) || type === 'recovery') {
        console.log("Recovery token detected");
        setIsRecoveryLogin(true);
        
        // Clear the URL hash/query after processing to avoid loops
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 100);
      }
    };

    checkForRecoveryToken();

    // Set up auth state listener FIRST
    const { data: { subscription }} = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change:", event);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Check if this is a recovery login
        if (event === 'PASSWORD_RECOVERY') {
          console.log("PASSWORD_RECOVERY event detected");
          setIsRecoveryLogin(true);
          toast({
            title: "Redefinição de senha",
            description: "Por favor, defina sua nova senha.",
          });
          navigate('/redefinir-senha');
          return;
        }
        
        // Only redirect if we're not already on the landing page
        if (event === 'SIGNED_IN' && session) {
          // If it's a recovery login, navigate to reset password
          if (isRecoveryLogin) {
            console.log("Redirecting to reset password page");
            navigate('/redefinir-senha');
          } 
          // Otherwise check if we're on the landing page or auth page and redirect accordingly
          else if (location.pathname === '/' || location.pathname === '/auth') {
            navigate('/dashboard');
          }
        }
        
        // Redirect to landing page on logout
        if (event === 'SIGNED_OUT') {
          // Reset recovery status when signing out
          setIsRecoveryLogin(false);
          navigate('/');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }}) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Initial redirection logic
      if (session) {
        // If it's a recovery login, navigate to reset password
        if (isRecoveryLogin) {
          console.log("Session exists with recovery flag - redirecting to reset password");
          navigate('/redefinir-senha');
        }
        // Otherwise check landing page or auth page and redirect accordingly
        else if (location.pathname === '/' || location.pathname === '/auth') {
          navigate('/dashboard');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname, isRecoveryLogin]);

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up existing auth state
      cleanupAuthState();
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Reset recovery status on regular login
      setIsRecoveryLogin(false);
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    // Clean up auth state
    cleanupAuthState();
    
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Continue even if this fails
      console.error('Error during sign out:', err);
    }
    
    // Reset recovery status when signing out
    setIsRecoveryLogin(false);
  };
  
  const forgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth?type=recovery',
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };
  
  const resetPassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (!error) {
        // Reset the recovery status after successful password change
        setIsRecoveryLogin(false);
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        session, 
        user, 
        isLoading, 
        isRecoveryLogin,
        signIn, 
        signUp, 
        signOut,
        forgotPassword,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
