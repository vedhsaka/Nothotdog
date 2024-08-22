import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import googleSignInIcon from '../icons/google-signin.webp';

function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signIn(rememberMe);
      navigate('/voice-evaluation');
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  };

  return (
    <div className="sign-in-container">
      <div className="sign-in-box">
        <h2>Nothotdog</h2>
        <p className="welcome">Welcome</p>
        <p>Log in to NotHotDog (Alpha)</p>
        <button className="google-sign-in-button" onClick={handleGoogleSignIn}>
          <img src={require('../icons/google-signin.webp')} alt="Google G" className="google-logo" />
          <span className="button-text">Sign in with Google</span>
        </button>
        <div className="remember-me">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="rememberMe">Remember Me</label>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
