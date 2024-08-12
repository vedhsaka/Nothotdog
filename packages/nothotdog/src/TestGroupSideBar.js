import React, { useState, useEffect } from 'react';
import './css/TestGroupSideBar.css';
import { SignInModal } from './UtilityModals'; // Ensure SignInModal is correctly imported
import useAuthFetch from './AuthFetch';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate


const TestGroupSidebar = ({ projectId, onGroupSelect, onInputSelect, onTextGroupSelect, componentType }) => {
  const { signIn, userId } = useAuth(); // Access signIn and userId function
  const { authFetch, showSignInModal, setShowSignInModal } = useAuthFetch(); // Destructure showSignInModal and setShowSignInModal
  const [voiceData, setVoiceData] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate hook


  useEffect(() => {
    if (userId) {
      fetchVoiceData();
    } else {
      setIsLoading(false);
      setError('Please login to view recorded tests.');
      // setShowSignInModal(true);
    }
  }, [userId]);

  const fetchVoiceData = async () => {
    try {
      const response = await authFetch('api/inputs/', {
        headers: {
          'userId': userId
        }
      });
      const data = await response;
      setVoiceData(data.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching voice data:', error);
      setError('Failed to fetch voice data.');
      setIsLoading(false);
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  const handleTextGroupClick = (group) => {
    const groupType = group.inputs.length > 0 ? group.inputs[0].input_type : 'unknown';

    // Disable clicking for text groups in EvaluationComponent and for voice groups in RestEvaluationComponent
    if ((componentType === 'voice' && groupType === 'text')) {
      navigate('/text-evaluation', { state: { selectedGroup: group } });

      return; // Do nothing if the group type should be disabled
    }
    if (group.inputs && group.inputs.length > 0) {
        onTextGroupSelect(group.inputs);
    }
};

const handleGroupClick = (group) => {
  const groupType = group.inputs.length > 0 ? group.inputs[0].input_type : 'unknown';

  if (componentType === 'text' && groupType === 'voice') {
    // Navigate to RestEvaluationComponent and pass the group as state
    navigate('/voice-evaluation', { state: { selectedGroup: group } });
    return;
  }

  if (groupType === 'text') {
    handleTextGroupClick(group);
  } else {
    onGroupSelect(group);
  }

  toggleGroup(group.uuid);
};

  const handleInputClick = (input) => {
    onInputSelect(input);
  };

  const handleAddGroup = async () => {
    if (!userId) {
      setShowSignInModal(true);
      return;
    }

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

      if (response.data) {
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

  const renderInputs = (inputs) => {
    return inputs.map(input => (
      <li key={input.uuid} className="voice-item" onClick={() => handleInputClick(input)}>
        {input.description || input.file_name || input.text_content}
      </li>
    ));
  };

  const renderGroups = (project) => {
    return project.groups.map(group => {
        const groupType = group.inputs.length > 0 ? group.inputs[0].input_type : 'unknown';
        return (
            <li key={group.uuid} className="group-item">
                <div className="group-header" onClick={() => {
                    if (groupType === 'text') {
                        handleTextGroupClick(group); // Handles text groups specifically
                    } else {
                        handleGroupClick(group); // Handles other group types
                    }
                    toggleGroup(group.uuid); // Ensure the group expands/collapses on click
                }}>
                    <span className={`expand-icon ${expandedGroups[group.uuid] ? 'expanded' : ''}`}>▶</span>
                    {group.name} ({groupType})
                </div>
                {expandedGroups[group.uuid] && (
                    <ul className={`voice-list ${expandedGroups[group.uuid] ? 'expanded' : ''}`}>
                        {renderInputs(group.inputs)}
                    </ul>
                )}
            </li>
        );
    });
};


  const renderIndividualInputs = (project) => {
    return project.inputs.map(input => (
      <li key={input.uuid} className="individual-voice-item" onClick={() => handleInputClick(input)}>
        {input.description || input.file_name || input.text_content}
      </li>
    ));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div class="error-message">{error}</div>;
  }

  return (
    <div className="test-group-sidebar">
      <div className="sidebar-header">
        <h3>Test Groups and Inputs</h3>
        <br/>
      </div>
      <button className="add-group-btn" onClick={() => setShowAddGroup(true)}>+New Test Group</button>

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
            <button onClick={() => setShowAddGroup(false)}>Cancel</button>
          </div>
        </div>
      )}
      {voiceData.map(project => (
        <div key={project.uuid}>
          <ul className="group-list">
            {renderGroups(project)}
          </ul>
          <ul className="individual-voice-list">
            {renderIndividualInputs(project)}
          </ul>
        </div>
      ))}

      {showSignInModal && (
        <SignInModal
          showSignInModal={showSignInModal}
          setShowSignInModal={setShowSignInModal}
          signIn={signIn} // Make sure signIn function is available
        />
      )}
    </div>
  );
};

const AudioPlayer = ({ audioBase64 }) => {
  let audioUrl;

  try {
    if (audioBase64 && typeof audioBase64 === 'string' && isValidBase64(audioBase64)) {
      audioUrl = `data:audio/wav;base64,${audioBase64}`;
    } else {
      throw new Error('Invalid base64 string');
    }
  } catch (error) {
    console.error('Failed to decode base64 audio:', error);
    audioUrl = ''; // Provide a fallback or leave it empty
  }

  return <audio controls src={audioUrl} />;
};

// Utility function to check if a string is valid base64
const isValidBase64 = (str) => {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
};

export default TestGroupSidebar;
