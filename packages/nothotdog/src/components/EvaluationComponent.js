import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/EvaluationComponent.css';
import '../styles/WebSocket.css';
import '../styles/Modal.css';
import ModalComponent from '../components/ModalComponent';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/AuthFetch';
import { openDB, storeAudio, getAudio, deleteAudio } from '../utils/IndexedDBUtils';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import AudioPlayer from './AudioPlayer';
import fetchTests from '../utils/fetchTests'; // Import fetchTests
import TestGroupSidebar from '../components/TestGroupSideBar';
import { SignInModal } from './UtilityModals';
import { useLocation } from 'react-router-dom';
import { evaluateTest } from './TestEvaluationHandler';


import { 
  b64toBlob, 
  capitalizeFirstLetter,
  evaluationMapping
} from '../utils/utils';

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
  const [inputUrl, setInputUrl] = useState('ws://');
  const [showModal, setShowModal] = useState(false);
  const [currentAudioBlob, setCurrentAudioBlob] = useState(null);
  const [description, setDescription] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [evaluations, setEvaluations] = useState([]); // Array of arrays
  const [phrases, setPhrases] = useState([]); // Array of arrays
  const [results, setResults] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const { authFetch } = useAuthFetch(); // Use the custom hook
  const location = useLocation();

  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [latencies, setLatencies] = useState([]);
  const [testGroups, setTestGroups] = useState([]);

  const [evaluationStatus, setEvaluationStatus] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [groupOptions, setGroupOptions] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [audioToSend, setAudioToSend] = useState(null);

  const [checkResults, setCheckResults] = useState([]); // Array of objects

  const [groupPassStatus, setGroupPassStatus] = useState(true);
  const [isEditCase, setIsEditCase] = useState(false);  // Track if updating or creating new
  const [savedTests, setSavedTests] = useState([]); // store loaded tests



  useEffect(() => {
    const fetchGroups = async () => {
      try {
        if (!userId) {
          console.error('User ID not found');
          return;
        }
        const response = await authFetch(`api/groups/${projectId}`);
        const groupsData = await response;
        const groups = groupsData.data.map(group => ({
          id: group.uuid,
          name: group.name
        }));
        setGroupOptions(groups);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };
  
    fetchGroups();
  }, []);
  
  

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

  useEffect(() => {
    if (location.state && location.state.selectedGroup) {
      handleGroupSelect(location.state.selectedGroup);
    }
    // Only run this effect once when the component mounts
  }, []);

  const evaluateAllTests = async () => {
    if (!selectedGroup) {
      alert("Please select a group first");
      return;
    }
    let groupPassStatus = true;
    setEvaluationStatus('Evaluating...');
  
    for (let i = 0; i < audioData.length; i++) {
      const audioBlob = await getAudio(audioData[i]);
      await sendAudioToWebSocket(audioBlob, i);
      try {
        const evaluationResult = await handleEvaluate(i);
        if (evaluationResult === 'fail') {
          groupPassStatus = false;
        }
      } catch (error) {
        groupPassStatus = false;
      }
    }
  
    setEvaluationStatus(groupPassStatus ? 'PASS' : 'FAIL');
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
    setIsEditCase(true);
    const audioId = Date.now() + Math.random(); // Generate a unique ID
    
    // Map checks to the new format
    const checks = voice.checks || {};
    
    // Only map the values of checks to phrases
    const phraseValues = checks.map(check => 
      typeof check.value === 'object' && check.value !== null ? JSON.stringify(check.value) : String(check.value)
    );
  
    // Only the evaluation types are needed for evaluations
    const evaluationTypes = Object.keys(checks).map(key => {
      const mappedType = evaluationMapping[key];
      return mappedType || 'exact_match'; // Default to 'exact_match' if no mapping found
    });
  
    // Update the state with the mapped checks
    setEvaluations((prevEvaluations) => [...prevEvaluations, evaluationTypes]);
    setPhrases((prevPhrases) => [...prevPhrases, phraseValues]);
    setResults((prevResults) => [...prevResults, null]);
    setLatencies((prevLatencies) => [...prevLatencies, { startTime: null, latency: null }]);
  
    // Store the audio data
    const audioBlob = b64toBlob(voice.content, 'audio/mp3');
    storeAudio(audioId, audioBlob);
    setAudioData((prevAudioData) => [...prevAudioData, audioId]);
    setOutputAudioData((prevOutputAudioData) => [...prevOutputAudioData, null]);

    // Set up the test for editing by saving it
    setSavedTests((prev) => [...prev, voice]); 
    setIsEditCase(true); // Set edit mode
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

  const sendAudioToWebSocket = (audioBlob, index) => {
    return new Promise((resolve, reject) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const startTime = new Date().getTime(); // Capture start time
  
        wsRef.current.send(audioBlob);
  
        wsRef.current.onmessage = async (event) => {
          const endTime = new Date().getTime();
          const outputAudioBlob = new Blob([event.data], { type: 'audio/mp3' });
          const id = Date.now();
          await storeAudio(id, outputAudioBlob);
  
          setLatencies((prevLatencies) => {
            const newLatencies = [...prevLatencies];
            const lastIndex = newLatencies.length - 1;
            if (lastIndex >= 0 && newLatencies[lastIndex].startTime) {
              const latency = endTime - newLatencies[lastIndex].startTime;
              newLatencies[lastIndex] = { ...newLatencies[lastIndex], latency };
            }
            return newLatencies;
          });
  
          updateOutputAudioDataById(id, index);
          setTranscripts((prevTranscripts) => [...prevTranscripts, event.data]);
  
          resolve(); // Resolve the promise when the message is received
        };
  
        wsRef.current.onerror = (error) => {
          setError('WebSocket error');
          console.error('WebSocket error:', error);
          reject(error); // Reject the promise if there's an error
        };
      } else {
        setError('WebSocket is not connected. Please connect first.');
        reject(new Error('WebSocket is not connected'));
      }
    });
  };  

  const updateOutputAudioDataById = (id, index) => {
    setOutputAudioData((prevOutputAudioData) => {
      const newOutputAudioData = [...prevOutputAudioData];
      newOutputAudioData[index] = id;
      return newOutputAudioData;
    });
  };  

  const connectWebSocket = () => {
    if (wsRef.current || !url) return;

    setError(''); // Clear any existing errors

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setConnected(true);
      };

      wsRef.current.onmessage = async (event) => {
        const endTime = new Date().getTime();
        const outputAudioBlob = new Blob([event.data], { type: 'audio/mp3' });
        const id = Date.now();
        await storeAudio(id, outputAudioBlob);
      
        setLatencies((prevLatencies) => {
          const newLatencies = [...prevLatencies];
          const lastIndex = newLatencies.length - 1;
          if (lastIndex >= 0 && newLatencies[lastIndex].startTime) {
            const latency = endTime - newLatencies[lastIndex].startTime;
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
        const audioBlob = new Blob(audioBufferRef.current, { type: 'audio/mp3' });
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
        const audioBlob = new Blob([reader.result], { type: 'audio/mp3' });
        wsRef.current.send(reader.result);
  
        const startTime = new Date().getTime(); // Capture start time
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

    // If the input doesn't start with 'ws://', add it
    if (!newUrl.startsWith('ws://')) {
      newUrl = 'ws://' + newUrl.replace(/^ws:?\/?/i, '');
    } else {
      // If it starts with 'ws://', ensure it's formatted correctly
      newUrl = 'ws://' + newUrl.slice(5).replace(/^ws:?\/?/i, '');
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

    if (!userId) {
      setShowSignInModal(true);
      console.error('User ID not found');
      return;
    }
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
      const checks = evaluations[selectedIndex].map((evalType, idx) => ({
        field: audioData[selectedIndex] ? `audio_${audioData[selectedIndex]}` : '', // You can customize this field name if needed
        rule: evalType,
        value: phrases[selectedIndex][idx],
      }));
  
      const data = {
        description: description,
        content: base64Audio,
        projectId: projectId, // Static or dynamic project ID
        checks: checks,
        inputType: "voice",
        // sequence: Number(selectedIndex + 1),
        groupId: selectedGroupId  // Include selected groupId
      };
  
      const response = await authFetch('api/inputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (response) {
        setDescription(''); // Clear description after saving
        setShowSaveModal(false); // Close modal
        alert('Test saved successfully');
      } else {
        alert('Failed to save the test');
      }
    };
    reader.readAsDataURL(audioBlob);
  };  

  const handleUpdate = (index) => {
    const testToUpdate = savedTests[index];
    setDescription(testToUpdate.description || '');
    setSelectedGroupId(testToUpdate.groupId || '');
    setSelectedIndex(index);
    setShowSaveModal(true);
  };

  const updateTest = async () => {
    if (description.trim() === '') {
      alert('Please provide a description.');
      setShowSaveModal(false);
      return;
    }

    if (selectedIndex === null) {
      alert('No test selected for updating.');
      setShowSaveModal(false);
      return;
    }

    const audioBlob = await getAudio(audioData[selectedIndex]);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      const checks = evaluations[selectedIndex].map((evalType, idx) => ({
        field: audioData[selectedIndex] ? `audio_${audioData[selectedIndex]}` : '',
        rule: evalType,
        value: phrases[selectedIndex][idx],
      }));

      const data = {
        description: description,
        content: base64Audio,
        projectId: projectId,
        checks: checks,
        inputType: "voice",
        sequence: Number(selectedIndex + 1),
        groupId: selectedGroupId  
      };

      const response = await authFetch(`api/inputs/${savedTests[selectedIndex].uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response) {
        setDescription(''); 
        setShowSaveModal(false); 
        setIsEditCase(false);
      } else {
        console.error('Failed to update the test');
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  
  const handleEvaluate = async (index) => {
    try {
      const evaluation = evaluations[index];
      const phrase = phrases[index];
      const outputAudioId = outputAudioData[index];
  
      const checks = evaluation.map((evalType, idx) => ({
        field: outputAudioId ? `audio_${outputAudioId}` : '',
        rule: evalType,
        value: phrase[idx],
      }));
  
      const result = await evaluateTest(outputAudioId, checks, 'voice', authFetch);
  
      setResults((prevResults) => {
        const newResults = [...prevResults];
        newResults[index] = result.test_result;
        return newResults;
      });
  
      setCheckResults((prevCheckResults) => {
        const newCheckResults = [...prevCheckResults];
        newCheckResults[index] = result.checks;
        return newCheckResults;
      });
  
      return result.test_result;
    } catch (error) {
      console.error('Failed to evaluate the test:', error);
      return 'FAIL';
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
    const audioId = audioData[index];
    const outputAudioId = outputAudioData[index];

    if (audioId) {
        deleteAudio(audioId).catch(error => console.error('Error deleting audio:', error));
    }
    if (outputAudioId) {
        deleteAudio(outputAudioId).catch(error => console.error('Error deleting output audio:', error));
    }

    // Remove the row data even if there's no audio associated with it
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
        onTextGroupSelect={handleGroupSelect}
        onSaveGroup={handleSaveGroup}
        projectId={projectId}
        authFetch={authFetch} 
        userId={userId}
        onInputSelect={handleVoiceSelect}
        componentType={'voice'}
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
          <div className="group-evaluate">
            <button 
              className="button semi-primary" 
              onClick={evaluateAllTests}
              disabled={!selectedGroup}
            >
              Evaluate All
            </button>
            {evaluationStatus && (
              <div className="evaluation-status">
                Evaluation Status: <span className={`result-indicator`}>Group Passed = {groupPassStatus}</span>
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
                <button className="audio-delete-row-button" onClick={() => handleDeleteRow(rowIndex)}>X</button>
                <div className="audio-section input-audio">
                  <AudioPlayer audioId={audioId} />
                  <span className="audio-label">Input</span>
                </div>
                <div className="audio-section output-audio">
                  <AudioPlayer audioId={outputAudioData[rowIndex]} />
                  <span className="audio-label">Output</span>
                </div>
                <div className="conditions-section">
                  {evaluations[rowIndex] && evaluations[rowIndex].map((evaluation, conditionIndex) => {
                    const checkResult = checkResults[rowIndex] && checkResults[rowIndex][evaluationMapping[evaluation]];
                    const passed = checkResult ? checkResult.passed : null;
                    const details = checkResult ? checkResult.details : null;

                    return (
                      <div key={conditionIndex} className="condition-row">
                        <select value={evaluation || 'exact_match'} onChange={(e) => {
                          const newEvaluations = [...evaluations];
                          newEvaluations[rowIndex][conditionIndex] = e.target.value;
                          setEvaluations(newEvaluations);
                        }}>
                          <option value="equals">Equals</option>
                          <option value="contains">Contains</option>
                          <option value="starts_with">Begins With</option>
                          <option value="ends_with">Ends With</option>
                          <option value="context_match">Contextually Contains</option>
                          <option value="greater_than">Greater than</option>
                          <option value="less_than">Less than</option>

                        </select>
                        <input type="text" value={phrases[rowIndex][conditionIndex] || ''} onChange={(e) => handlePhraseChange(rowIndex, conditionIndex, e.target.value)} placeholder="Enter phrase" />
                        <button className="delete-condition-button" onClick={() => handleDeleteCondition(rowIndex, conditionIndex)}>X</button>
                        {passed !== null && (
                          <span className={`dot ${passed ? 'green' : 'red'}`} title={details}></span>
                        )}
                      </div>
                    );
                  })}
                  <button className="add-condition-button" onClick={() => addCondition(rowIndex)}>Add Condition</button>
                </div>
                <div className="evaluate-section">
                  <button className="button primary" onClick={() => handleEvaluate(rowIndex)}>Evaluate</button>

                  {isEditCase ? (
                    <button className="button semi-primary" onClick={() => handleUpdate(rowIndex)}>Update</button>
                  ) : ( 
                  <button className="button semi-primary" onClick={() => handleSave(rowIndex)}>Save</button>
                  )}
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
                {audioToSend && audioId === audioData[rowIndex] && (
                  <div className="connect-websocket">
                    <button
                      className="button semi-primary"
                      onClick={() => sendAudioToWebSocket(audioToSend, rowIndex)}
                    >
                      Send to WebSocket
                    </button>
                  </div>
                )}
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
{showSignInModal && (
        <SignInModal
          showSignInModal={showSignInModal}
          setShowSignInModal={setShowSignInModal}
          headerContent="Sign In Required"
          signIn={signIn} // Make sure signIn function is available
        />
      )}

<ModalComponent
          showModal={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          headerContent={isEditCase ? "Update Test" : "Save Test"}
        >
          <label htmlFor="description">Description:</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
          />
        
          <label htmlFor="group">Select Group:</label>
          <select
            id="group"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            <option value="">Select a group</option>
            {groupOptions.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <div className="button-group">
            {isEditCase ? (
              <button className="button primary" onClick={updateTest}>
                Update
              </button>
            ) : (
              <button className="button primary" onClick={saveTest}>
                Save
              </button>
            )}
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
