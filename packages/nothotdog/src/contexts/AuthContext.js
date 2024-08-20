import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import apiFetch from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('user')) || null);
  const [userId, setUserId] = useState(() => sessionStorage.getItem('userId') || null);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(!user);

  const createUserInAPI = async (userId) => {
    try {
      const response = await apiFetch('api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const data = await response.json(); // Parse the JSON response
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

      if (!response) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json(); // Parse the JSON response
      if (data.length > 0) {
        setProjectId(data[0].uuid); // Save the project ID
        console.log('Project ID:', data[0].uuid);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = sessionStorage.getItem('user');
      if (!storedUser) {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const currentUser = data.session.user;
          setUser(currentUser);
          setUserId(currentUser.id);
          sessionStorage.setItem('user', JSON.stringify(currentUser));
          sessionStorage.setItem('userId', currentUser.id);
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
          sessionStorage.setItem('user', JSON.stringify(currentUser));
          sessionStorage.setItem('userId', currentUser.id);
          await createUserInAPI(currentUser.id);
          await fetchProjects(currentUser.id);
        } else {
          setUser(null);
          setUserId(null);
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('userId');
        }
        setLoading(false);
      });
  
      return () => {
        authListener?.subscription?.unsubscribe();
      };
    };
  
    // Set up the listener only if it's not already set up
    setupAuthListener();
  }, []);
  
  

  const signIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
      navigate('/voice-evaluation'); 
      // Optionally, handle redirection after sign-in here if needed
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserId(null);
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('userId');
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
