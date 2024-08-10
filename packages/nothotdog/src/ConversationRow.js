import React from 'react';
import { capitalizeFirstLetter } from './utils';
import './css/ConversationRow.css';
import APIConnectionForm from './APIConnectionForm';


const ConversationRow = React.forwardRef(({
  rowIndex,
  rowData,
  setRows,
  handlePhraseChange,
  handleDeleteRow,
  setOutputValue,
  handleDeleteCondition,
  addCondition,
  handleEvaluate,
  handleSave,
  dragHandleProps,
  draggableProps
}, ref) => {
  const apiDetails = rowData.apiDetails; // Assuming `apiDetails` is part of rowData
  const onSaveAPIConnection = (newData) => {
    // Logic to handle saving API connection details for this specific row
    handleSave(rowIndex, newData);
  };

  const handleInputChange = (e) => {
    const newInput = e.target.value;
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex].conversation.input = newInput;
      return newRows;
    });
  };

  const handleOutputChange = (e) => {
    const newOutput = e.target.value;
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex].conversation.output = newOutput;
      return newRows;
    });
  };

  const handleEvaluationChange = (conditionIndex, newValue) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex].conversation.evaluations[conditionIndex] = newValue;
      return newRows;
    });
  };

  const handleApiChange = (field, value) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex].api[field] = value;
      return newRows;
    });
  };

  return (
    <div className="parent-conversation-row" ref={ref} {...draggableProps}>
      <div className="drag-handle" {...dragHandleProps}>⋮</div>
      <button className="delete-row-button" onClick={() => handleDeleteRow(rowIndex)}>X</button>
      <div className="api-connection-form">
        <APIConnectionForm 
          initialValues={apiDetails} 
          onSave={onSaveAPIConnection}
          setOutputValue={setOutputValue}
          handleApiChange={handleApiChange}

        />
      </div>
      <div className="conversation-row">
      {/* Conversation Section */}
      <div className="input-output-section">
        <div className="input-section">
          <textarea
            value={rowData.conversation.input}
            onChange={handleInputChange}
            placeholder="Enter API input"
            className="input-textarea"
          />
          <span className="input-label">Input</span>
        </div>
        <div className="output-section">
          <textarea
            value={rowData.conversation.output}
            onChange={handleOutputChange}
            placeholder="Enter expected output or API output will appear here"
            className="output-textarea"
          />
          <span className="output-label">Output</span>
        </div>
      </div>

      <div className="conditions-section">
        {rowData.conversation.evaluations && rowData.conversation.evaluations.map((evaluation, conditionIndex) => (
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
              value={rowData.conversation.phrases[conditionIndex] || ''} 
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

      {rowData.conversation.result !== null && (
        <div className={`result-section result-section-${rowIndex}`}>
          <span className={`result-indicator ${
            rowData.conversation.result === 'pass' ? 'pass' : 
            rowData.conversation.result === 'fail' ? 'fail' : ''
          }`}>
            {rowData.conversation.result === 'pass' || rowData.conversation.result === 'fail' ? capitalizeFirstLetter(rowData.conversation.result) : ''}
          </span>
        </div>
      )}

      <div className="latency-row">
        <span className="latency-label">Latency:</span>
        <span className="latency-value">
          {rowData.conversation.latency?.latency != null ? `${rowData.conversation.latency.latency} ms` : 'N/A'}
        </span>
      </div>
      </div>
      <hr></hr>
    </div>
  );
});

export default ConversationRow;