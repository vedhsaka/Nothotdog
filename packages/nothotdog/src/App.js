import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/App.css';
import WebSocketComponent from './WebSocketComponent';
import RecordedTests from './RecordedTestsComponent';
import ConfigurationComponent from './ConfigurationComponent';
import EvaluationComponent from './EvaluationComponent';
import RestEvaluationComponent from './RestEvaluationComponent';
import Sidebar from './Sidebar';
import { AuthProvider, useAuth } from './AuthContext';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

function SignInComponent() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSignIn = async () => {
      try {
        await signIn();
      } catch (error) {
        console.error('Sign-in failed:', error);
      } finally {
        navigate('/voice-evaluation');
      }
    };

    handleSignIn();
  }, [signIn, navigate]);

  return null;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('Voice Evaluation');
  const { user, signIn, signOut } = useAuth();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="app">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        user={user}
        signIn={signIn}
        signOut={signOut}
      />
      <div className="main-content">
        <div className="content-wrapper">
          <Routes>
            <Route path="/sign-in" element={<SignInComponent />} />
            <Route path="/api-testing" element={<WebSocketComponent />} />
            <Route path="/recorded-tests" element={<RecordedTests />} />
            <Route path="/configuration" element={<ConfigurationComponent />} />
            <Route path="/voice-evaluation" element={<EvaluationComponent />} />
            <Route path="/text-evaluation" element={<RestEvaluationComponent />} />
            <Route path="/" element={<Navigate to="/voice-evaluation" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;