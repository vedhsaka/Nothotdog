import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './styles/App.css';
import RecordedTests from './components/RecordedTestsComponent';
import EvaluationComponent from './components/EvaluationComponent';
import RestEvaluationComponent from './components/RestEvaluationComponent';
import Sidebar from './components/Sidebar';
import SignInPage from './components/SignInPageComponent';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/sign-in" />;
}

function AppContent() {
  const { user, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('voice-evaluation');  // Initialize state

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
          <Routes>
            <Route
              path="/voice-evaluation"
              element={<PrivateRoute><EvaluationComponent /></PrivateRoute>}
            />
            <Route
              path="/text-evaluation"
              element={<PrivateRoute><RestEvaluationComponent /></PrivateRoute>}
            />
            <Route
              path="/recorded-tests"
              element={<PrivateRoute><RecordedTests /></PrivateRoute>}
            />
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
        <Routes>
          {/* Separate route for the sign-in page without the sidebar */}
          <Route path="/sign-in" element={<SignInPage />} />
          
          {/* Private routes that require authentication */}
          <Route path="/*" element={<PrivateRoute><AppContent /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
