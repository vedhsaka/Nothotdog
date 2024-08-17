import React, { useState, useEffect } from 'react';
import './../styles/ConfigurationComponent.css';

const ConfigurationComponent = () => {
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);
  const [llmEvaluationEnabled, setLlmEvaluationEnabled] = useState(false);
  const [textToVoiceEnabled, setTextToVoiceEnabled] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const savedTranscriptionEnabled = JSON.parse(localStorage.getItem('transcriptionEnabled')) || false;
    const savedLlmEvaluationEnabled = JSON.parse(localStorage.getItem('llmEvaluationEnabled')) || false;
    const savedTextToVoiceEnabled = JSON.parse(localStorage.getItem('textToVoiceEnabled')) || false;

    setTranscriptionEnabled(savedTranscriptionEnabled);
    setLlmEvaluationEnabled(savedLlmEvaluationEnabled);
    setTextToVoiceEnabled(savedTextToVoiceEnabled);
  }, []);

  useEffect(() => {
    const savedTranscriptionEnabled = JSON.parse(localStorage.getItem('transcriptionEnabled')) || false;
    const savedLlmEvaluationEnabled = JSON.parse(localStorage.getItem('llmEvaluationEnabled')) || false;
    const savedTextToVoiceEnabled = JSON.parse(localStorage.getItem('textToVoiceEnabled')) || false;

    if (
      transcriptionEnabled !== savedTranscriptionEnabled ||
      llmEvaluationEnabled !== savedLlmEvaluationEnabled ||
      textToVoiceEnabled !== savedTextToVoiceEnabled
    ) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [transcriptionEnabled, llmEvaluationEnabled, textToVoiceEnabled]);

  const handleUpdate = () => {
    localStorage.setItem('transcriptionEnabled', JSON.stringify(transcriptionEnabled));
    localStorage.setItem('llmEvaluationEnabled', JSON.stringify(llmEvaluationEnabled));
    localStorage.setItem('textToVoiceEnabled', JSON.stringify(textToVoiceEnabled));
    setIsDirty(false);
  };

  const handleCancel = () => {
    const savedTranscriptionEnabled = JSON.parse(localStorage.getItem('transcriptionEnabled')) || false;
    const savedLlmEvaluationEnabled = JSON.parse(localStorage.getItem('llmEvaluationEnabled')) || false;
    const savedTextToVoiceEnabled = JSON.parse(localStorage.getItem('textToVoiceEnabled')) || false;

    setTranscriptionEnabled(savedTranscriptionEnabled);
    setLlmEvaluationEnabled(savedLlmEvaluationEnabled);
    setTextToVoiceEnabled(savedTextToVoiceEnabled);
    setIsDirty(false);
  };

  return (
    <div className="configuration-component">
      <h2>Configuration Settings</h2>
      <div className="option">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={transcriptionEnabled}
            onChange={() => setTranscriptionEnabled(!transcriptionEnabled)}
          />
          Enable Transcription Services
        </label>
      </div>
      <div className="option">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={llmEvaluationEnabled}
            onChange={() => setLlmEvaluationEnabled(!llmEvaluationEnabled)}
          />
          Enable LLM Based Contextual Evaluation
        </label>
      </div>
      <div className="option">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={textToVoiceEnabled}
            onChange={() => setTextToVoiceEnabled(!textToVoiceEnabled)}
          />
          Enable Text to Voice Conversion Services
        </label>
      </div>
      {isDirty && (
        <div className="buttons">
          <button className="button primary" onClick={handleUpdate}>Update</button>
          <button className="button secondary" onClick={handleCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default ConfigurationComponent;
