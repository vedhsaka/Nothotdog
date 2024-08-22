import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import apiFetch from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || null);
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || sessionStorage.getItem('userId') || null);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(!user);

  // Helper function to set cookies
  const setCookie = (name, value, days) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; Secure; HttpOnly; SameSite=Strict`;
  };

  const createUserInAPI = async (userId) => {
    try {
      const response = await apiFetch('api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid: userId }),
      });

      if (!response) {
        throw new Error('Failed to create user');
      }

      const data = await response;
      console.log('User created in API:', data);
    } catch (error) {
      console.error('Error creating user in API:', error);
    }
  };

  const fetchProjects = async (userId) => {
    try {
      const response = await apiFetch('api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'userId': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response;
      if (data.length > 0) {
        setProjectId(data[0].uuid);
        console.log('Project ID:', data[0].uuid);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!storedUser) {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const currentUser = data.session.user;
          setUser(currentUser);
          setUserId(currentUser.id);
          localStorage.setItem('user', JSON.stringify(currentUser));
          localStorage.setItem('userId', currentUser.id);
          await createUserInAPI(currentUser.id);
          await fetchProjects(currentUser.id);
        } else {
          setUser(null);
          setUserId(null);
        }
        setLoading(false);
      }
    };

    fetchUser();

    const setupAuthListener = () => {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const currentUser = session.user;
          setUser(currentUser);
          setUserId(currentUser.id);
          // Use cookies if the user wants to remain signed in
          setCookie('auth_token', session.access_token, 7); // Expires in 7 days
          localStorage.setItem('user', JSON.stringify(currentUser));
          localStorage.setItem('userId', currentUser.id);
          await createUserInAPI(currentUser.id);
          await fetchProjects(currentUser.id);
        } else {
          setUser(null);
          setUserId(null);
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
        }
        setLoading(false);
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    };

    setupAuthListener();
  }, []);

  const signIn = async (rememberMe) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;

      if (data.session?.user) {
        const currentUser = data.session.user;
        setUser(currentUser);
        setUserId(currentUser.id);
        if (rememberMe) {
          setCookie('auth_token', data.session.access_token, 7); // Store in cookie with 7-day expiry
          localStorage.setItem('user', JSON.stringify(currentUser));
          localStorage.setItem('userId', currentUser.id);
        } else {
          sessionStorage.setItem('user', JSON.stringify(currentUser));
          sessionStorage.setItem('userId', currentUser.id);
        }
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserId(null);
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } catch (error) {
      console.error('Error during sign-out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userId, projectId, signIn, signOut }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
