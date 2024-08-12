import React, { useState } from 'react';
import './css/App.css';
import WebSocketComponent from './WebSocketComponent';
import RecordedTests from './RecordedTestsComponent';
import ConfigurationComponent from './ConfigurationComponent';
import EvaluationComponent from './EvaluationComponent';
import RestEvaluationComponent from './RestEvaluationComponent';
import Sidebar from './Sidebar';
import { AuthProvider, useAuth } from './AuthContext';
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';

function AppContent() {
  const [activeTab, setActiveTab] = useState('Voice Evaluation'); // Set the default tab
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'API Testing':
        navigate('/api-testing');
        break;
      case 'Recorded Tests':
        navigate('/recorded-tests');
        break;
      case 'Configuration':
        navigate('/configuration');
        break;
      case 'Voice Evaluation':
        navigate('/voice-evaluation');
        break;
      case 'Text Evaluation':
        navigate('/text-evaluation');
        break;
      default:
        navigate('/voice-evaluation');
        break;
    }
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
            <Route path="/api-testing" element={<WebSocketComponent />} />
            <Route path="/recorded-tests" element={<RecordedTests />} />
            <Route path="/configuration" element={<ConfigurationComponent />} />
            <Route path="/voice-evaluation" element={<EvaluationComponent />} />
            <Route path="/text-evaluation" element={<RestEvaluationComponent />} />
            <Route path="/" element={<Navigate to="/voice-evaluation" />} /> {/* Default route */}
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
