import React from 'react';
import { capitalizeFirstLetter } from './utils';
import './css/ConversationRow.css';

const ConversationRow = React.forwardRef(({
  rowIndex,
  input,
  output,
  setInputs,
  setOutputs,
  evaluations,
  setEvaluations,
  phrases,
  setPhrases,
  handlePhraseChange,
  handleDeleteRow,
  handleDeleteCondition,
  addCondition,
  handleEvaluate,
  handleSave,
  results,
  latencies,
  dragHandleProps,
  draggableProps
}, ref) => {

  const handleInputChange = (e) => {
    const newInput = e.target.value;
    setInputs(prev => {
      const newInputs = [...prev];
      newInputs[rowIndex] = newInput;
      return newInputs;
    });
  };

  const handleOutputChange = (e) => {
    const newOutput = e.target.value;
    setOutputs(prev => {
      const newOutputs = [...prev];
      newOutputs[rowIndex] = newOutput;
      return newOutputs;
    });
  };

  const handleEvaluationChange = (conditionIndex, newValue) => {
    setEvaluations(prev => {
      const newEvaluations = [...prev];
      newEvaluations[rowIndex][conditionIndex] = newValue;
      return newEvaluations;
    });
  };

  return (
    <div className="conversation-row" ref={ref} {...draggableProps}>
      <div className="drag-handle" {...dragHandleProps}>⋮</div>
      <button className="delete-row-button" onClick={() => handleDeleteRow(rowIndex)}>X</button>
      
      <div className="input-output-section">
        <div className="input-section">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Enter API input"
            className="input-textarea"
          />
          <span className="input-label">Input</span>
        </div>
        <div className="output-section">
          <textarea
            value={output}
            onChange={handleOutputChange}
            placeholder="Enter expected output or API output will appear here"
            className="output-textarea"
          />
          <span className="output-label">Output</span>
        </div>
      </div>

      <div className="conditions-section">
        {evaluations[rowIndex] && evaluations[rowIndex].map((evaluation, conditionIndex) => (
          <div key={conditionIndex} className="condition-row">
            <select 
              value={evaluation || 'exact_match'} 
              onChange={(e) => handleEvaluationChange(conditionIndex, e.target.value)}
            >
              <option value="exact_match">Exact Match</option>
              <option value="contains">Contains</option>
              <option value="begins_with">Begins With</option>
              <option value="ends_with">Ends With</option>
              <option value="word_count">Word Count</option>
              <option value="contextually_contains">Contextually Contains</option>
            </select>
            <input 
              type="text" 
              value={phrases[rowIndex][conditionIndex] || ''} 
              onChange={(e) => handlePhraseChange(rowIndex, conditionIndex, e.target.value)} 
              placeholder="Enter phrase or value"
            />
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
            results[rowIndex] === 'pass' ? 'pass' : 
            results[rowIndex] === 'fail' ? 'fail' : ''
          }`}>
            {results[rowIndex] === 'pass' || results[rowIndex] === 'fail' ? capitalizeFirstLetter(results[rowIndex]) : ''}
          </span>
        </div>
      )}

      <div className="latency-row">
        <span className="latency-label">Latency:</span>
        <span className="latency-value">
          {latencies[rowIndex]?.latency != null ? `${latencies[rowIndex].latency} ms` : 'N/A'}
        </span>
      </div>
    </div>
  );
});

export default ConversationRow;