import React, { useState, useEffect, useRef, useCallback } from 'react';
import './css/EvaluationComponent.css';
import './Components/Modal.css';
import ModalComponent from './Components/ModalComponent';
import { useAuth } from './AuthContext';
import useAuthFetch from './AuthFetch';
import fetchTests from './fetchTests';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import TestGroupSidebar from './TestGroupSideBar';
import APIRequestForm from './APIConnectionForm';
import { SaveTestModal, SignInModal } from './UtilityModals';


import { 
  capitalizeFirstLetter,
  evaluationMapping
} from './utils';

const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

const RestEvaluationComponent = () => {
  const { user, signIn, projectId, userId } = useAuth();

  const [transcripts, setTranscripts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [bodyParams, setBodyParams] = useState('{}'); // Default to an empty JSON object
  const [queryParams, setQueryParams] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [evaluations, setEvaluations] = useState([]); // Array of arrays
  const [phrases, setPhrases] = useState([]); // Array of arrays
  const [results, setResults] = useState([]);
  const authFetch = useAuthFetch(); // Use the custom hook

  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [latencies, setLatencies] = useState([]);
  const [testGroups, setTestGroups] = useState([]);

  const [evaluationStatus, setEvaluationStatus] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);

  const handleSaveGroup = async (data) => {
    return await authFetch('api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    clearConversationRows();
    group.voices.forEach(voice => loadVoiceAsConversationRow(voice));
  };

  const handleEvaluateAll = () => {
    if (!selectedGroup) {
      alert("Please select a group first");
      return;
    }
    // Mock evaluation
    setEvaluationStatus('Evaluating...');
    setTimeout(() => {
      setEvaluationStatus('FAIL');
    }, 1000); // Simulate a delay
  };

  const handleVoiceSelect = (voice) => {
    clearConversationRows();
    loadVoiceAsConversationRow(voice);
  };

  const clearConversationRows = () => {
    setTranscripts([]);
    setEvaluations([]);
    setPhrases([]);
    setResults([]);
    setLatencies([]);
  };

  const loadVoiceAsConversationRow = (voice) => {
    const audioId = Date.now() + Math.random(); // Generate a unique ID
    const checks = voice.checks || {};
    const evaluationTypes = Object.keys(checks).map(key => {
      const mappedType = evaluationMapping[key];
      return mappedType || 'exact_match'; // Default to 'exact_match' if no mapping found
    });
    const phraseValues = Object.values(checks);
    updateStateArrays(audioId, null, evaluationTypes, phraseValues, null);
    setTranscripts(prev => [...prev, voice.transcript]);
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  const handleAuthTokenChange = (e) => {
    setAuthToken(e.target.value);
  };

  const handleBodyParamsChange = (e) => {
    setBodyParams(e.target.value);
  };

  const handleQueryParamsChange = (e) => {
    setQueryParams(e.target.value);
  };

  const handleSaveTest = (audioId) => {
    if (!user) {
      localStorage.setItem('audioId', JSON.stringify(audioId));
      setShowSignInModal(true);
      return;
    }
    setShowModal(true);
  };

  const handleSave = (index) => {
    setDescription(''); // Reset description to empty string
    setSelectedIndex(index);
    setShowSaveModal(true);
  }; 
  
  const saveTest = async () => {
    if (description.trim() === '') {
      alert('Please provide a description.');
      setShowSaveModal(false);
      return;
    }
  
    if (selectedIndex === null) {
      alert('No test selected for saving.');
      setShowSaveModal(false);
      return;
    }
  
    const checks = {};
  
    evaluations[selectedIndex].forEach((evalType, idx) => {
      checks[evaluationMapping[evalType]] = phrases[selectedIndex][idx];
    });
  
    const data = {
      description,
      transcript: transcripts[selectedIndex],
      projectId: projectId,
      checks: checks,
      sequence: Number(selectedIndex + 1)
    };
  
    const response = await authFetch('api/voices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  
    if (response.ok) {
      console.log('Test saved successfully');
      setDescription(''); // Clear description after saving
      setShowSaveModal(false); // Close modal
    } else {
      console.error('Failed to save the test');
    }
  };

  const handleEvaluate = async (index) => {
    const evaluation = evaluations[index];
    const phrase = phrases[index];

    const checks = {};

    evaluation.forEach((evalType, idx) => {
      checks[evaluationMapping[evalType]] = phrase[idx];
    });

    const body = {
      description: description,
      audioBase64: 'Uk1GRjIAAABXQVZFZm10IBIAAAABAAEA....', // Placeholder
      projectId: projectId,
      groupId: selectedGroup ? selectedGroup.uuid : '',
      checks,
    };

    const startTime = new Date().getTime();

    try {
      const response = await fetch(`${url}?${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      const endTime = new Date().getTime();
      const latency = endTime - startTime;

      const result = await response.json();

      const newResults = [...results];
      newResults[index] = result.test_result; // Assuming the API returns a "test_result" field with "Pass" or "Fail"
      setResults(newResults);

      setLatencies((prev) => {
        const newLatencies = [...prev];
        newLatencies[index] = { startTime, latency };
        return newLatencies;
      });
    } catch (error) {
      console.error('Failed to evaluate the test:', error);
      setError('Failed to evaluate the test. Please check the URL and try again.');
    }
  };

  const handlePhraseChange = useCallback((index, conditionIndex, value) => {
    setPhrases((prevPhrases) => {
      const newPhrases = [...prevPhrases];
      newPhrases[index][conditionIndex] = value;
      return newPhrases;
    });
  }, []);

  const handleDeleteRow = (index) => {
    setTranscripts((prev) => prev.filter((_, i) => i !== index));
    setEvaluations((prev) => prev.filter((_, i) => i !== index));
    setPhrases((prev) => prev.filter((_, i) => i !== index));
    setResults((prev) => prev.filter((_, i) => i !== index));
    setLatencies((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteCondition = (rowIndex, conditionIndex) => {
    setEvaluations((prevEvaluations) => {
      const newEvaluations = [...prevEvaluations];
      newEvaluations[rowIndex].splice(conditionIndex, 1);
      return newEvaluations;
    });
    setPhrases((prevPhrases) => {
      const newPhrases = [...prevPhrases];
      newPhrases[rowIndex].splice(conditionIndex, 1);
      return newPhrases;
    });
  };

  const addCondition = (index) => {
    setEvaluations((prev) => {
      const newEvaluations = [...prev];
      if (!Array.isArray(newEvaluations[index])) {
        newEvaluations[index] = [];
      }
      newEvaluations[index] = [...newEvaluations[index], ''];
      return newEvaluations;
    });
    setPhrases((prev) => {
      const newPhrases = [...prev];
      if (!Array.isArray(newPhrases[index])) {
        newPhrases[index] = [];
      }
      newPhrases[index] = [...newPhrases[index], ''];
      return newPhrases;
    });
  };

  const addConversationRow = () => {
    updateStateArrays(null, null, [], [], null);
  };

  useEffect(() => {
    fetchTests(authFetch, setTests, setError);
    const storedAudioId = localStorage.getItem('audioId');
    if (storedAudioId) {
      setShowSignInModal(true);
      localStorage.removeItem('audioId');
    }
  }, []); // make sure this useEffect block runs only once on mount

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorder = (list, startIndex, endIndex) => {
      const result = Array.from(list);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    };

    setTranscripts((prev) => reorder(prev, result.source.index, result.destination.index));
    setEvaluations((prev) => reorder(prev, result.source.index, result.destination.index));
    setPhrases((prev) => reorder(prev, result.source.index, result.destination.index));
    setResults((prev) => reorder(prev, result.source.index, result.destination.index));
    setLatencies((prev) => reorder(prev, result.source.index, result.destination.index));
  };

  const updateStateArrays = (audioId, endTime, evaluation, phrase, result) => {
    setTranscripts((prev) => [...prev, '']);
    setEvaluations((prev) => [...prev, evaluation]);
    setPhrases((prev) => [...prev, phrase]);
    setResults((prev) => [...prev, result]);
    setLatencies((prev) => [...prev, { startTime: endTime, latency: null }]);
  };

  return (
    <div className="evaluation-container">
      <TestGroupSidebar 
        testGroups={testGroups} 
        onSelectGroup={handleGroupSelect} 
        onGroupSelect={handleGroupSelect} 
        onSaveGroup={handleSaveGroup}
        projectId={projectId}
        authFetch={authFetch} 
        userId={userId}
        onVoiceSelect={handleVoiceSelect}
      />
      <div className="evaluation-component">
        <APIRequestForm 
          url={url}
          authToken={authToken}
          queryParams={queryParams}
          bodyParams={bodyParams}
          setUrl={setUrl}
          setAuthToken={setAuthToken}
          setQueryParams={setQueryParams}
          setBodyParams={setBodyParams}
          connected={connected}
          setConnected={setConnected}
          error={error}
        />
        <hr />
        <div className="transcript-box">
          <h3>Conversations</h3>
          {selectedGroup && (
            <div className="group-evaluation-section">
              <div>{selectedGroup ? `Selected Group: ${selectedGroup.name}` : 'No group selected'}</div>
              <div className="group-evaluate">
                <button 
                  className="button semi-primary" 
                  onClick={handleEvaluateAll}
                  disabled={!selectedGroup}
                >
                  Evaluate All
                </button>
                {evaluationStatus && (
                  <div className="evaluation-status">
                    Evaluation Status: <span className="result-indicator fail">{evaluationStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <button className="add-row-button" onClick={addConversationRow}>+</button>
          <DragDropContext onDragEnd={onDragEnd}>
            <StrictModeDroppable droppableId="droppable-conversations">
              {(provided) => (
                <div
                  className="conversations"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {transcripts.map((transcript, rowIndex) => (
                    <Draggable
                      key={rowIndex}
                      draggableId={`transcript-${rowIndex}`}
                      index={rowIndex}
                    >
                      {(provided) => (
                        <ConversationRow
                          rowIndex={rowIndex}
                          transcript={transcript}
                          transcripts={transcripts}
                          setTranscripts={setTranscripts}
                          evaluations={evaluations}
                          setEvaluations={setEvaluations}
                          phrases={phrases}
                          setPhrases={setPhrases}
                          handlePhraseChange={handlePhraseChange}
                          handleDeleteRow={handleDeleteRow}
                          handleDeleteCondition={handleDeleteCondition}
                          addCondition={addCondition}
                          handleEvaluate={handleEvaluate}
                          handleSave={handleSave}
                          results={results}
                          latencies={latencies}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </div>
        <SaveTestModal
          showModal={showModal}
          setShowModal={setShowModal}
          description={description}
          setDescription={setDescription}
          saveTest={saveTest}
        />
        <SignInModal
          showSignInModal={showSignInModal}
          setShowSignInModal={setShowSignInModal}
          signIn={signIn}
        />
      </div>
    </div>
  );  
};

export default RestEvaluationComponent;
