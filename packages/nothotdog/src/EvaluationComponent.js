import React, { useState, useEffect, useRef, useCallback } from 'react';
import './css/EvaluationComponent.css';
import './Components/Modal.css';
import ModalComponent from './Components/ModalComponent';
import { useAuth } from './AuthContext';
import useAuthFetch from './AuthFetch';
import { openDB, storeAudio, getAudio, deleteAudio } from './IndexedDBUtils';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import AudioPlayer from './AudioPlayer';
import fetchTests from './fetchTests'; // Import fetchTests
import TestGroupSidebar from './TestGroupSideBar';
import { 
  b64toBlob, 
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

const EvaluationComponent = () => {
  const { user, signIn, projectId, userId } = useAuth();

  const [transcripts, setTranscripts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(''); // Mode: 'speak' or 'upload'
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioBufferRef = useRef([]); // Buffer to store audio chunks
  const [audioData, setAudioData] = useState([]); // Store audio IDs
  const [outputAudioData, setOutputAudioData] = useState([]); // Store output audio IDs
  const [url, setUrl] = useState('ws://');
  const [showModal, setShowModal] = useState(false);
  const [currentAudioBlob, setCurrentAudioBlob] = useState(null);
  const [description, setDescription] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [evaluations, setEvaluations] = useState([]); // Array of arrays
  const [phrases, setPhrases] = useState([]); // Array of arrays
  const [results, setResults] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
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
    // Filter and process only voice inputs
    group.inputs
      .filter(input => input.input_type === 'voice')
      .forEach(voice => loadVoiceAsConversationRow(voice));
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
    setAudioData([]);
    setOutputAudioData([]);
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
    // Store the audio data
    const audioBlob = b64toBlob(voice.audioBase64, 'audio/webm');
    storeAudio(audioId, audioBlob);
  };

  const handleSelectGroup = (groupId) => {
    console.log('Selected group ID:', groupId);
    // Here you can handle what happens when a group is selected
  };
  
  useEffect(() => {
    fetchTests(authFetch, setTests, setError);
  }, []); // make sure this useEffect block runs only once on mount

  const handleFileSelection = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUploadSelectedTest = async () => {
    if (!selectedTest) return;

    try {
      const selectedAudio = tests.find(test => test.file_name === selectedTest);
      const audioBlob = selectedAudio.audioBlob;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(audioBlob); // Send the file content to the WebSocket server

        // Add the selected file as a new conversation row
        const id = Date.now();
        await storeAudio(id, audioBlob);
        updateStateArrays(id, null, [], [], null);
      } else {
        setError('WebSocket is not connected. Please connect first.');
      }
    } catch (error) {
      setError('Failed to upload the selected test');
      console.error('Error:', error);
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current || !url) return;

    setError(''); // Clear any existing errors

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setConnected(true);
        console.log('WebSocket connected');
      };

      wsRef.current.onmessage = async (event) => {
        const endTime = new Date().getTime();
        console.log('WebSocket message received at:', endTime);
        console.log('WebSocket message:', event.data);
        const outputAudioBlob = new Blob([event.data], { type: 'audio/webm' });
        const id = Date.now();
        await storeAudio(id, outputAudioBlob);
      
        setLatencies((prevLatencies) => {
          const newLatencies = [...prevLatencies];
          const lastIndex = newLatencies.length - 1;
          if (lastIndex >= 0 && newLatencies[lastIndex].startTime) {
            const latency = endTime - newLatencies[lastIndex].startTime;
            console.log('Start time:', newLatencies[lastIndex].startTime);
            console.log('End time:', endTime);
            console.log('Calculated latency:', latency);
            newLatencies[lastIndex] = { ...newLatencies[lastIndex], latency };
          }
          return newLatencies;
        });
      
        updateOutputAudioData(id);
        setTranscripts((prevTranscripts) => [...prevTranscripts, event.data]);
      }; 

      wsRef.current.onclose = () => {
        setConnected(false);
        setMode('');
        console.log('WebSocket disconnected');
      };

      wsRef.current.onerror = (error) => {
        setError('Failed to connect. Please check the URL and try again.');
        setConnected(false);
        wsRef.current.close(); // Ensure the WebSocket is closed on error
        wsRef.current = null;
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      setError('Failed to connect. Please check the URL and try again.');
      console.error('WebSocket connection error:', e);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    setMode('');
  };

  const startRecording = async () => {
    setMode('speak');
    audioBufferRef.current = []; // Reset the audio buffer

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioBufferRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioBufferRef.current, { type: 'audio/webm' });
        const id = Date.now();
        await storeAudio(id, audioBlob);
        setAudioData((prevAudioData) => [...prevAudioData, id]);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(audioBlob);
        }
      };

      mediaRecorder.start(1000); // Collect data in chunks every 1000ms
    } catch (error) {
      setError('Failed to access the microphone.');
      console.error('Microphone access error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      const startTime = new Date().getTime(); // Capture start time
      console.log('Request sent at:', startTime);
      audioBufferRef.current.push(startTime); // Store start time in buffer
      setLatencies((prev) => [...prev, { startTime, latency: null }]);
    }
    setMode('');
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;
  
    setMode('upload');
  
    const reader = new FileReader();
    reader.onload = async () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const audioBlob = new Blob([reader.result], { type: 'audio/webm' });
        wsRef.current.send(reader.result);
  
        const startTime = new Date().getTime(); // Capture start time
        console.log('Request sent at:', startTime);
        const id = Date.now();
        await storeAudio(id, audioBlob);
        updateStateArrays(id, startTime, [], [], null);
      } else {
        setError('WebSocket is not connected. Please connect first.');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleUrlChange = (e) => {
    let newUrl = e.target.value;

    // Check if the URL begins with 'https://'
    if (newUrl.startsWith('https://') || newUrl.startsWith('http://')) {
      alert('Web Socket API URLs are needed');
      newUrl = ''; // Clear the URL field
    } else {
      // Remove any instances of 'ws://ws://'
      if (newUrl.includes('ws://ws://')) {
        newUrl = newUrl.replace('ws://ws://', '');
      }
      // Add 'ws://' if the URL does not begin with it
      if (!newUrl.startsWith('ws://')) {
        newUrl = 'ws://' + newUrl;
      }
    }

    setUrl(newUrl);
  };

  const handleSaveTest = (audioId) => {
    if (!user) {
      // Save the current audio blob ID to localStorage
      localStorage.setItem('audioId', JSON.stringify(audioId));
      setShowSignInModal(true);
      return;
    }
    setCurrentAudioBlob(audioId);
    setShowModal(true);
  };

  const handleSave = (index) => {
    setCurrentAudioBlob(audioData[index]);
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
  
    const audioBlob = await getAudio(audioData[selectedIndex]);
  
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      const checks = {};
  
      // Dynamically generate checks based on evaluations and phrases
      evaluations[selectedIndex].forEach((evalType, idx) => {
        checks[evaluationMapping[evalType]] = phrases[selectedIndex][idx];
      });
  
      const data = {
        description: description,
        content: base64Audio,
        projectId: projectId, // Static or dynamic project ID
        checks: checks,
        input_type: "voice",
        sequence: Number(selectedIndex + 1)
      };
  
      const response = await authFetch('api/inputs', {
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
    reader.readAsDataURL(audioBlob);
  };

  const handleEvaluate = async (index) => {
    const evaluation = evaluations[index];
    const phrase = phrases[index];
    const outputAudioId = outputAudioData[index];

    const outputAudioBlob = await getAudio(outputAudioId);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      const checks = {};

      evaluation.forEach((evalType, idx) => {
        checks[evaluationMapping[evalType]] = phrase[idx];
      });

      const response = await authFetch('api/test-inputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: base64Audio,
          checks,
          inputType: "voice"
        }),
      });

      if (response) {
        const result = await response;
        const newResults = [...results];

        newResults[index] = result.test_result; // Assuming the API returns a "result" field with "Pass" or "Fail"
        setResults(newResults);
      } else {
        console.error('Failed to evaluate the test');
      }
    };

    reader.readAsDataURL(outputAudioBlob);
  };

  const handlePhraseChange = useCallback((index, conditionIndex, value) => {
    setPhrases((prevPhrases) => {
      const newPhrases = [...prevPhrases];
      newPhrases[index][conditionIndex] = value;
      return newPhrases;
    });
  }, []);

  const handleDeleteRow = (index) => {
    const audioId = audioData[index];
    const outputAudioId = outputAudioData[index];

    deleteAudio(audioId);
    deleteAudio(outputAudioId);
    setAudioData((prev) => prev.filter((_, i) => i !== index));
    setOutputAudioData((prev) => prev.filter((_, i) => i !== index));
    setEvaluations((prev) => prev.filter((_, i) => i !== index));
    setPhrases((prev) => prev.filter((_, i) => i !== index));
    setResults((prev) => prev.filter((_, i) => i !== index));
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
    const storedAudioId = localStorage.getItem('audioId');
    if (storedAudioId) {
      setCurrentAudioBlob(JSON.parse(storedAudioId));
      localStorage.removeItem('audioId');
    }

    return () => {
      disconnectWebSocket();
    };
  }, []);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorder = (list, startIndex, endIndex) => {
      const result = Array.from(list);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    };

    setAudioData((prev) => reorder(prev, result.source.index, result.destination.index));
    setOutputAudioData((prev) => reorder(prev, result.source.index, result.destination.index));
    setEvaluations((prev) => reorder(prev, result.source.index, result.destination.index));
    setPhrases((prev) => reorder(prev, result.source.index, result.destination.index));
    setResults((prev) => reorder(prev, result.source.index, result.destination.index));
  };

  const updateStateArrays = (audioId, endTime, evaluation, phrase, result) => {
    setAudioData((prev) => [...prev, audioId]);
    setOutputAudioData((prev) => [...prev, null]);
    setEvaluations((prev) => [...prev, evaluation]);
    setPhrases((prev) => [...prev, phrase]);
    setResults((prev) => [...prev, result]);
    setLatencies((prev) => [...prev, { startTime: endTime, latency: null }]);
  };

  const updateOutputAudioData = (id) => {
    setOutputAudioData((prevOutputAudioData) => {
      const newOutputAudioData = [...prevOutputAudioData];
      const index = newOutputAudioData.findLastIndex(audioId => audioId === null);
      if (index !== -1) {
        newOutputAudioData[index] = id;
      } else {
        // If no null value is found, append to the end
        newOutputAudioData.push(id);
      }
      return newOutputAudioData;
    });
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
        onInputSelect={handleVoiceSelect}
      />

    <div className="evaluation-component">
    {/* Top left button to create new test group */}

      <div className="input-group">
        <label htmlFor="websocket-url"
          className="label"
          title="Please enter the WebSocket API URL to connect to your Agent and initiate testing"
        >
          Web Socket API URL:</label>
        <input
          type="text"
          className="input"
          id="websocket-url"
          value={url}
          onChange={handleUrlChange}
          placeholder="Enter WebSocket URL"
        />
        <div className="button-group">
          <button
            className={`button ${connected ? 'disabled' : 'primary'}`}
            onClick={connectWebSocket}
            disabled={connected}
          >
            Connect
          </button>
          <button
            className={`button ${connected ? 'primary' : 'disabled'}`}
            onClick={disconnectWebSocket}
            disabled={!connected}
          >
            Disconnect
          </button>
        </div>
        {error && <div className="error-box">{error}</div>}
      </div>
      <div className="action-group">
        <h3>Choose Action</h3>
        {connected && (
          <div className="action-buttons">
            <div className="left-action">
              <span className="description">
                1. Record the audio from your microphone.
              </span>
              <button
                className={`button ${mode === 'speak' ? 'secondary' : 'add-condition-button'}`}
                onClick={mode === 'speak' ? stopRecording : startRecording}
                disabled={!connected}
              >
                {mode === 'speak' ? 'Stop Speaking' : 'Start Speaking'}
              </button>
            </div>
            <div className="right-action">
              <span className="description">
                2. Upload a pre-recorded audio file.
              </span>
              <div className="file-upload-group">
                <input
                  type="file"
                  accept="audio/*"
                  className="file-input"
                  onChange={handleFileSelection}
                  disabled={!connected}
                  style={{ marginTop: '0px' }}
                  />
                <button
                  className="button add-condition-button"
                  onClick={handleFileUpload}
                  disabled={!selectedFile || !connected}
                >
                  Upload
                </button>
              </div>
            </div>
            <div className="list-action">
              <span className="description">
                3. Select from list of existing recordings.
              </span>
              <div className="dropdown-upload-group">
                <select
                  className="dropdown"
                  onChange={(e) => setSelectedTest(e.target.value)}
                  disabled={!connected}
                >
                  <option value="">Select a recording</option>
                  {tests.map((test, index) => (
                    <option key={index} value={test.file_name}>
                      {test.description || test.file_name}
                    </option>
                  ))}
                </select>
                <button
                  className="button add-condition-button"
                  onClick={handleUploadSelectedTest}
                  disabled={!selectedTest || !connected}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <hr />
      <div className="transcript-box">
       <h3>Conversations</h3>

       {selectedGroup && (
          <div className="group-evaluation-section">
          <div>{selectedGroup ? `Selected Group: ${selectedGroup.name}` : 'No group selected'}</div>
            <div class="group-evaluate">
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
        {audioData.map((audioId, rowIndex) => (
          <Draggable
            key={rowIndex}
            draggableId={`audio-${rowIndex}`}
            index={rowIndex}
          >
            {(provided) => (
              <div className="conversation-row" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                <button className="delete-row-button" onClick={() => handleDeleteRow(rowIndex)}>X</button>
                <div className="audio-section input-audio">
                  <AudioPlayer audioId={audioId} />
                  <span className="audio-label">Input</span>
                </div>
                <div className="audio-section output-audio">
                  <AudioPlayer audioId={outputAudioData[rowIndex]} />
                  <span className="audio-label">Output</span>
                </div>
                <div className="conditions-section">
                  {evaluations[rowIndex] && evaluations[rowIndex].map((evaluation, conditionIndex) => (
                    <div key={conditionIndex} className="condition-row">
                      <select value={evaluation || 'exact_match'} onChange={(e) => {
                        const newEvaluations = [...evaluations];
                        newEvaluations[rowIndex][conditionIndex] = e.target.value;
                        setEvaluations(newEvaluations);
                      }}>
                        <option value="exact_match">Exact Match</option>
                        <option value="word_count">Word Count</option>
                        <option value="contains">Contains</option>
                        <option value="ends">Ends With</option>
                        <option value="contextually">Contextually Contains</option>
                        <option value="begins_with">Begins With</option>
                      </select>
                      <input type="text" value={phrases[rowIndex][conditionIndex] || ''} onChange={(e) => handlePhraseChange(rowIndex, conditionIndex, e.target.value)} placeholder="Enter phrase" />
                      <button className="delete-condition-button" onClick={() => handleDeleteCondition(rowIndex, conditionIndex)}>X</button>
                    </div>
                  ))}
                  <button className="add-condition-button" onClick={() => addCondition(rowIndex)}>Add Condition</button>
                </div>
                <div className="evaluate-section">
                  <button className="button primary" onClick={() => handleEvaluate(rowIndex)}>Evaluate</button>
                  <button className="button semi-primary" onClick={() => handleSave(rowIndex)}>Save</button>
                </div>
                {results[rowIndex] !== null && (
                  <div className={`result-section result-section-${rowIndex}`}>
                    <span className={`result-indicator ${
                      results[rowIndex] === 'pass' ? 'pass'
                      : results[rowIndex] === 'fail' ? 'fail'
                      : ''
                    }`}>
                      {results[rowIndex] === 'pass' || results[rowIndex] === 'fail' ? capitalizeFirstLetter(results[rowIndex]) : ''}
                    </span>
                  </div>
                )}

                <div className="latency-row">
                  <span className="latency-value">
                    {latencies[rowIndex]?.latency != null ? `Latency: ${latencies[rowIndex].latency} ms` : 'Latency: N/A'}
                  </span>
                </div>
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </StrictModeDroppable>
</DragDropContext>
</div>
      <ModalComponent
        showModal={showModal}
        onClose={() => setShowModal(false)}
        headerContent={'Save Test'}
      >
        <label htmlFor="description">Description:</label>
        <input
          className='file-input'
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
        />
        <div className="button-group">
          <button className="button primary" onClick={saveTest}>
            Save
          </button>
          <button className="button" onClick={() => setShowModal(false)}>
            Cancel
          </button>
        </div>
      </ModalComponent>
      <ModalComponent
        showModal={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        headerContent={'Sign In Required'}
      >
        <p>You need to sign in to save tests.</p>
        <button className="button primary" onClick={signIn}>Sign In</button>
      </ModalComponent>

      <ModalComponent
        showModal={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        headerContent="Enter Description for the Test"
      >
        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
        />
        <div className="button-group">
          <button className="button primary" onClick={saveTest}>
            Save
          </button>
          <button className="button" onClick={() => setShowSaveModal(false)}>
            Cancel
          </button>
        </div>
      </ModalComponent>

    </div>
    </div>
  );
};

export default EvaluationComponent;
