import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import apiFetch from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(true);


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

      if (!response.ok) {
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
      setLoading(true);
      
      // Check local storage first
      const storedUser = localStorage.getItem('user');
      const storedUserId = localStorage.getItem('userId');
      const storedProjectId = localStorage.getItem('projectId');
      
      if (storedUser && storedUserId) {
        setUser(JSON.parse(storedUser));
        setUserId(storedUserId);
        setProjectId(storedProjectId);
        setLoading(false);
        return;
      }

      // If not in local storage, fetch from Supabase
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        setUserId(data.session.user.id);
        localStorage.setItem('user', JSON.stringify(data.session.user));
        localStorage.setItem('userId', data.session.user.id);
        
        await createUserInAPI(data.session.user.id);
        await fetchProjects(data.session.user.id);
      } else {
        setUser(null);
        setUserId(null);
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('projectId');
      }
      setLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      if (session?.user) {
        setUser(session.user);
        setUserId(session.user.id);
        localStorage.setItem('user', JSON.stringify(session.user));
        localStorage.setItem('userId', session.user.id);
        
        await createUserInAPI(session.user.id);
        const projects = await fetchProjects(session.user.id);
        if (projects && projects.length > 0) {
          setProjectId(projects[0].uuid);
          localStorage.setItem('projectId', projects[0].uuid);
        }
      } else {
        setUser(null);
        setUserId(null);
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('projectId');
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
      // Note: Redirection is handled by Supabase OAuth flow
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('projectId');
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