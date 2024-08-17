import React, { useState, useEffect, useRef } from 'react';
import '../styles/WebSocketComponent.css';
import '../styles/Modal.css';
import ModalComponent from './ModalComponent';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/AuthFetch';

const WebSocketComponent = () => {
  const { user, signIn } = useAuth(); // Correctly get user and signIn from useAuth

  const [transcripts, setTranscripts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(''); // Mode: 'speak' or 'upload'
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioBufferRef = useRef([]); // Buffer to store audio chunks
  const [audioData, setAudioData] = useState([]);
  const [url, setUrl] = useState('ws://');
  const [showModal, setShowModal] = useState(false);
  const [currentAudioBlob, setCurrentAudioBlob] = useState(null);
  const [description, setDescription] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const { projectId } = useAuth();
  const authFetch = useAuthFetch(); // Use the custom hook

  const AudioPlayer = ({ audioBlob }) => {
    const [url, setUrl] = useState(null);

    useEffect(() => {
      if (audioBlob) {
        const newUrl = URL.createObjectURL(audioBlob);
        setUrl(newUrl);
        return () => URL.revokeObjectURL(newUrl);
      }
    }, [audioBlob]);

    return url ? <audio controls src={url} /> : <div></div>;
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

      wsRef.current.onmessage = (event) => {
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioBufferRef.current, { type: 'audio/webm' });
        setAudioData(prevAudioData => [...prevAudioData, audioBlob]);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(audioBlob);
        }
      };

      mediaRecorder.start(2500); // Collect data in chunks every 2500ms
    } catch (error) {
      setError('Failed to access the microphone.');
      console.error('Microphone access error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setMode('');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setMode('upload');

    const reader = new FileReader();
    reader.onload = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(reader.result);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUrlChange = (e) => {
    let newUrl = e.target.value;
    if (newUrl.includes('ws://ws://')) {
      newUrl = newUrl.replace('ws://ws://', '');
    }
    setUrl(newUrl);
  };

  const handleSaveTest = (audioBlob) => {
    if (!user) {
      // Save the current audio blob to localStorage
      localStorage.setItem('audioBlob', JSON.stringify(audioBlob));
      setShowSignInModal(true);
      return;
    }
    setCurrentAudioBlob(audioBlob);
    setShowModal(true);
  };

  const saveTest = async () => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      const response = await authFetch('api/inputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          content: base64Audio,
          type: "voice",
          projectId: projectId, // Static or dynamic project ID,
          groupId: null,
          checks: {},
          sequence: 1

        }),
      });

      if (response.ok) {
        console.log('Test saved successfully');
        setShowModal(false);
        setDescription('');
        setCurrentAudioBlob(null);
      } else {
        console.error('Failed to save the test');
      }
    };
    reader.readAsDataURL(currentAudioBlob);
  };

  useEffect(() => {
    const storedAudioBlob = localStorage.getItem('audioBlob');
    if (storedAudioBlob) {
      setCurrentAudioBlob(new Blob([JSON.parse(storedAudioBlob)], { type: 'audio/webm' }));
      localStorage.removeItem('audioBlob');
    }
    
    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <div className="websocket-component">
      <div className="input-group">
        <label htmlFor="websocket-url" className="label">WebSocket API URL:</label>
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
          <>
            <button
              className={`button ${mode === 'speak' ? 'primary' : ''}`}
              onClick={mode === 'speak' ? stopRecording : startRecording}
              disabled={!connected}
            >
              {mode === 'speak' ? 'Stop Speaking' : 'Connect and Speak'}
            </button>
            <input
              type="file"
              accept="audio/*"
              className="file-input"
              onChange={handleFileUpload}
              disabled={!connected}
            />
          </>
        )}
      </div>
      <hr />
      <div className="transcript-box">
        <h3>Conversations</h3>
        <div className="conversations">
          {transcripts.map((transcript, index) => (
            <div key={index} className="conversation">
              <div className="right-side">
                <AudioPlayer audioBlob={audioData[index]} />
                {audioData[index] && (
                  <button className="button primary" onClick={() => handleSaveTest(audioData[index])}>
                    Save Test
                  </button>
                )}
              </div>
              <br />
              <div className="transcript">{transcript}</div>
            </div>
          ))}
        </div>
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
    </div>
  );
};

export default WebSocketComponent;
