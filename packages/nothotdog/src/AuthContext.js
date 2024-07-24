import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import apiFetch from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [projectId, setProjectId] = useState(null);

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

      if (!response) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response;
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
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        setUserId(data.session.user.id);
        await createUserInAPI(data.session.user.id); // Call the API here
        await fetchProjects(data.session.user.id); // Call the projects API here
      } else {
        setUser(null);
        setUserId(null);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUserId(session.user.id);
        await createUserInAPI(session.user.id); // Call the API here
        await fetchProjects(session.user.id); // Call the projects API here
      } else {
        setUser(null);
        setUserId(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userId, projectId, signIn: () => supabase.auth.signInWithOAuth({ provider: 'google' }), signOut: () => supabase.auth.signOut() }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
