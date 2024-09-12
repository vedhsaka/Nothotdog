import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import '../styles/TestGroupSideBar.css';
import { SignInModal } from './UtilityModals';
import useAuthFetch from '../hooks/AuthFetch';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sendApiRequest } from './ApiRequestHandler';
import { evaluateTest } from './TestEvaluationHandler';

const TestGroupSidebar = ({ projectId, onGroupSelect, onInputSelect, onTextGroupSelect, componentType }) => {
  const { signIn, userId } = useAuth();
  const { authFetch, showSignInModal, setShowSignInModal } = useAuthFetch();
  const [voiceData, setVoiceData] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchVoiceData();
    } else {
      setIsLoading(false);
      setError('Please login to view recorded tests and use additional features.');
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
      console.error('Error fetching inputs:', error);
      setError('Failed to fetch inputs.');
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

    if ((componentType === 'voice' && groupType === 'text')) {
      navigate('/text-evaluation', { state: { selectedGroup: group } });
      return;
    }
    if (group.inputs && group.inputs.length > 0) {
      onTextGroupSelect(group);
    }
  };

  const handleGroupClick = (group) => {
    const groupType = group.inputs.length > 0 ? group.inputs[0].input_type : 'unknown';

    if (componentType === 'text' && groupType === 'voice') {
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
        fetchVoiceData();
      } else {
        alert('Failed to create new group. Please try again.');
      }
    } catch (error) {
      console.error('Error creating new group:', error);
      alert('An error occurred while creating the group.');
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const sourceGroupId = source.droppableId;
    const destGroupId = destination.droppableId;

    if (sourceGroupId !== destGroupId) {
      return;
    }

    const newVoiceData = [...voiceData];
    const projectIndex = newVoiceData.findIndex(project => 
      project.groups.some(group => group.uuid === sourceGroupId)
    );
    const groupIndex = newVoiceData[projectIndex].groups.findIndex(group => group.uuid === sourceGroupId);
    const group = newVoiceData[projectIndex].groups[groupIndex];
    
    const [reorderedItem] = group.inputs.splice(source.index, 1);
    group.inputs.splice(destination.index, 0, reorderedItem);

    setVoiceData(newVoiceData);

    // Save the new order
    try {
      await authFetch(`api/groups/${sourceGroupId}/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'userId': userId
        },
        body: JSON.stringify({
          inputs: group.inputs.map((input, index) => ({
            uuid: input.uuid,
            sequence: index + 1
          }))
        })
      });
    } catch (error) {
      console.error('Error saving new sequence:', error);
      alert('Failed to save the new order. Please try again.');
    }
  };

  const handleRunGroup = async (group) => {
    if (!userId) {
      setShowSignInModal(true);
      return;
    }
  
    let groupPassed = true;
    const updatedInputs = [];
    for (const input of group.inputs) {
      try {
        // Make the API call to the user's endpoint
        const apiResponse = await sendApiRequest({
          method: input.method || 'GET',
          url: input.url,
          params: input.queryParams || [],
          headers: input.headers|| {},
          body: input.body || {}
        });
        
        // Evaluate the test using the centralized function
        const result = await evaluateTest(
          apiResponse.data, 
          input.checks, 
          input.inputType,
          authFetch
        );

        const testPassed = result.test_result === 'pass';
        groupPassed = groupPassed && testPassed;

        updatedInputs.push({
          ...input,
          testResult: testPassed ? 'pass' : 'fail'
        });
      } catch (error) {
        console.error(`Error running test for input ${input.uuid}:`, error);
        groupPassed = false;
        updatedInputs.push({
          ...input,
          testResult: 'error'
        });
      }
    }

    setVoiceData(prevData => {
      return prevData.map(project => ({
        ...project,
        groups: project.groups.map(g => {
          if (g.uuid === group.uuid) {
            return {
              ...g,
              inputs: updatedInputs,
              groupResult: groupPassed ? 'pass' : 'fail'
            };
          }
          return g;
        })
      }));
    });
  };

  const renderInputs = (inputs, groupId) => (
    <Droppable droppableId={groupId}>
      {(provided) => (
        <ul {...provided.droppableProps} ref={provided.innerRef} className={`voice-list ${expandedGroups[groupId] ? 'expanded' : ''}`}>
          {inputs.map((input, index) => (
            <Draggable key={input.uuid} draggableId={input.uuid} index={index}>
              {(provided) => (
                <li
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`voice-item ${input.testResult || ''}`}
                  onClick={() => handleInputClick(input)}
                >
                  {input.description || input.file_name || input.text_content}
                </li>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </ul>
      )}
    </Droppable>
  );

  const renderGroups = (project) => {
    return project.groups.map(group => {
      const groupType = group.inputs.length > 0 ? group.inputs[0].input_type : 'unknown';
      return (
        <li key={group.uuid} className={`group-item ${group.groupResult || ''}`}>
          <div className="group-header">
            <span 
              className={`expand-icon ${expandedGroups[group.uuid] ? 'expanded' : ''}`}
              onClick={() => toggleGroup(group.uuid)}
            >
              ▶
            </span>
            <span onClick={() => handleGroupClick(group)}>{group.name} ({groupType})</span>
            <button 
              className="run-group-button"
              onClick={(e) => {
                e.stopPropagation();
                handleRunGroup(group);
              }}
            >
              Run
            </button>
            {group.groupResult && (
              <span className={`group-result-icon`}>
                {group.groupResult === 'pass' ? '✅' : '❌'}
              </span>
            )}
          </div>
          {expandedGroups[group.uuid] && renderInputs(group.inputs, group.uuid)}
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
    return <div className="login-warning-message">{error}</div>;
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
      <DragDropContext onDragEnd={onDragEnd}>
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
      </DragDropContext>

      {showSignInModal && (
        <SignInModal
          showSignInModal={showSignInModal}
          setShowSignInModal={setShowSignInModal}
          signIn={signIn}
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