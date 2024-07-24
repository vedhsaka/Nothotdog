import React, { useState, useEffect } from 'react';
import './css/TestGroupSideBar.css';

const TestGroupSidebar = ({ authFetch, userId, projectId, onGroupSelect, onVoiceSelect }) => {
  const [voiceData, setVoiceData] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    fetchVoiceData();
  }, []);

  const fetchVoiceData = async () => {
    try {
      const response = await authFetch('api/voices/', {
        headers: {
          'userId': userId
        }
      });
      const data = await response;
      setVoiceData(data.data);
    } catch (error) {
      console.error('Error fetching voice data:', error);
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleGroupClick = (group) => {
    toggleGroup(group.uuid);
    onGroupSelect(group);
  };

  const handleVoiceClick = (voice) => {
    onVoiceSelect(voice);
  };

  const handleAddGroup = async () => {
    if (newGroupDescription.trim() === '') {
      alert('Please enter a description for the new group.');
      return;
    }

    try {
      const response = await authFetch('api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userId': userId
        },
        body: JSON.stringify({
          project_id: projectId,
          name: newGroupDescription
        })
      });

      if (response.ok) {
        setNewGroupDescription('');
        setShowAddGroup(false);
        fetchVoiceData(); // Refresh the list of groups
      } else {
        alert('Failed to create new group. Please try again.');
      }
    } catch (error) {
      console.error('Error creating new group:', error);
      alert('An error occurred while creating the group.');
    }
  };

  const renderVoices = (voices) => {
    return voices.map(voice => (
      <li key={voice.uuid} className="voice-item" onClick={() => handleVoiceClick(voice)}>
        {voice.description || voice.file_name}
      </li>
    ));
  };

  const renderGroups = (project) => {
    return project.voices[0].groups.map(group => (
      <li key={group.uuid} className="group-item">
        <div onClick={() => handleGroupClick(group)} className="group-header">
          <span className={`expand-icon ${expandedGroups[group.uuid] ? 'expanded' : ''}`}>▶</span>
          {group.name}
        </div>
        {expandedGroups[group.uuid] && (
          <ul className={`voice-list ${expandedGroups[group.uuid] ? 'expanded' : ''}`}>
            {renderVoices(group.voices)}
          </ul>
        )}
      </li>
    ));
  };

  const renderIndividualVoices = (project) => {
    return project.voices[0].voices.map(voice => (
      <li key={voice.uuid} className="individual-voice-item" onClick={() => handleVoiceClick(voice)}>
        {voice.description || voice.file_name}
      </li>
    ));
  };

  return (
    <div className="test-group-sidebar">
      <div className="sidebar-header">
        <h3>Test Groups and Voices</h3>
        <br/>

      </div>
      <button className="add-group-btn" onClick={() => setShowAddGroup(true)}>+</button>


      {showAddGroup && (
        <div className="add-group-form">
          <input
            type="text"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            placeholder="Enter group description"
          />
          <div className="add-group-buttons">
            <button onClick={handleAddGroup}>Save</button>
            <button onClick={() => setShowAddGroup(false)}>X</button>
          </div>
        </div>
      )}
      {voiceData.map(project => (
        <div key={project.uuid}>
          <ul className="group-list">
            {renderGroups(project)}
          </ul>
          <ul className="individual-voice-list">
            {renderIndividualVoices(project)}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default TestGroupSidebar;