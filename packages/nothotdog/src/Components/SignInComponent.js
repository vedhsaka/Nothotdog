import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Make sure this line is included
import { useAuth } from './AuthContext';

function SignInComponent() {
  const { signIn } = useAuth();
  const navigate = useNavigate(); // This hook must be correctly imported

  useEffect(() => {
    const handleSignIn = async () => {
      try {
        await signIn();
      } catch (error) {
        console.error('Sign-in failed:', error);
      } finally {
        navigate('/voice-evaluation'); // Redirect to /voice-evaluation regardless
      }
    };

    handleSignIn();
  }, [signIn, navigate]);

  return null; // No UI to render
}

export default SignInComponent;
