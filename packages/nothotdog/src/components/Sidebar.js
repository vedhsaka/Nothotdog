import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import '../styles/Sidebar.css';
import apiSettings from '../icons/api-testing.svg';
import voiceTests from '../icons/voice-cases.svg';
import flame from '../icons/flame.svg';

const Sidebar = ({ setActiveTab, activeTab, user, signIn, signOut }) => {
  const navigate = useNavigate(); // Initialize useNavigate hook

  const tabs = [
    { name: 'Voice APIs', icon: flame, path: '/voice-evaluation' },
    { name: 'Rest APIs', icon: apiSettings, path: '/text-evaluation' },
    { name: 'Recorded Tests', icon: voiceTests, path: '/recorded-tests' }
  ];

  const handleTabClick = (tab) => {
    setActiveTab(tab.name);
    navigate(tab.path); // Navigate to the tab's path
  };

  return (
    <nav className="horizontal-sidebar">
      <div className="sidebar-left">
        <div className="flame-header">
          <h1>NotHotDog</h1>
        </div>
      </div>
      
      <div className="sidebar-center">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            className={`tab-button ${activeTab === tab.name ? 'active' : ''}`}
            onClick={() => handleTabClick(tab)} // Handle tab click
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
