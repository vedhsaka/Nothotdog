import React, { useState } from 'react';
import './css/App.css';
import WebSocketComponent from './WebSocketComponent';
import RecordedTests from './RecordedTestsComponent';
import ConfigurationComponent from './ConfigurationComponent';
import EvaluationComponent from './EvaluationComponent';
import RestEvaluationComponent from './RestEvaluationComponent';
import Sidebar from './Sidebar';
import { AuthProvider, useAuth } from './AuthContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('API Testing');
  const { user, signIn, signOut } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'API Testing':
        return <WebSocketComponent />;
      case 'Recorded Tests':
        return <RecordedTests />;
      case 'Configuration':
        return <ConfigurationComponent />;
      case 'Voice Evaluation':
        return <EvaluationComponent />;
      case 'Text Evaluation':
        return <RestEvaluationComponent />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="app">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        signIn={signIn}
        signOut={signOut}
      />
      <div className="main-content">
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;