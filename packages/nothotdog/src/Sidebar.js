import React from 'react';
import './css/Sidebar.css';
import apiSettings from './icons/api-testing.svg';
import voiceTests from './icons/voice-cases.svg';
import settings from './icons/settings.svg';
import flame from './icons/flame.svg';
import flameIcon from './icons/flame.svg'; // Make sure to import the flame icon

const Sidebar = ({ setActiveTab, activeTab, user, signIn, signOut }) => {
  const tabs = [
    { name: 'API Testing', icon: apiSettings },
    { name: 'Recorded Tests', icon: voiceTests },
    { name: 'Configuration', icon: settings },
    { name: 'Evaluation', icon: flame },
  ];

  return (
    <nav className="horizontal-sidebar">
      <div className="sidebar-left">
        <div className="flame-header">
          <img src={flameIcon} alt="Flame" className="flame-icon" />
          <h1>Flame</h1>
        </div>
      </div>
      
      <div className="sidebar-center">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            className={`tab-button ${activeTab === tab.name ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.name)}
          >
            <img src={tab.icon} alt={tab.name} className="tab-icon" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>
      
      <div className="sidebar-right">
        {user ? (
          <div className="user-info">
            <span>{user.email}</span>
            <button onClick={signOut} className="button">Sign Out</button>
          </div>
        ) : (
          <button onClick={signIn} className="button">Sign In</button>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;