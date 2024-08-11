import React from 'react';
import { capitalizeFirstLetter } from './utils';
import './css/ConversationRow.css';
import APIConnectionForm from './APIConnectionForm';

const ConversationRow = React.forwardRef(({
  rowIndex,
  rowData,
  setRows,
  handleApiResponse,  // Add this prop
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
  const apiDetails = rowData?.apiDetails || {};
  const conversation = rowData?.conversation || {};

  const onSaveAPIConnection = (newData) => {
    handleSave(rowIndex, newData);
  };

  const handleInputChange = (e) => {
    const newInput = e.target.value;
    setRows(prev => {
      const newRows = [...prev];
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = {};
      }
      newRows[rowIndex].conversation.input = newInput;
      return newRows;
    });
  };

  const handleOutputChange = (e) => {
    const newOutput = e.target.value;
    setRows(prev => {
      const newRows = [...prev];
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = {};
      }
      newRows[rowIndex].conversation.output = newOutput;
      return newRows;
    });
  };

  const handleEvaluationChange = (conditionIndex, newValue) => {
    setRows(prev => {
      const newRows = [...prev];
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = { evaluations: [] };
      }
      if (!newRows[rowIndex].conversation.evaluations) {
        newRows[rowIndex].conversation.evaluations = [];
      }
      newRows[rowIndex].conversation.evaluations[conditionIndex] = newValue;
      return newRows;
    });
  };

  const handleApiChange = (field, value) => {
    setRows(prev => {
      const newRows = [...prev];
      if (!newRows[rowIndex].api) {
        newRows[rowIndex].api = {};
      }
      newRows[rowIndex].api[field] = value;
      return newRows;
    });
  };

  const handleSetOutput = (keyPath, value) => {
    console.log('Setting output:', keyPath, value);
    setRows(prev => {
      const newRows = [...prev];
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = {};
      }
      newRows[rowIndex].conversation.outputKey = keyPath;
      newRows[rowIndex].conversation.output = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return newRows;
    });
  };

  const handleOutputKeyChange = (e) => {
    const newOutputKey = e.target.value;
    setRows(prev => {
      const newRows = [...prev];
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = {};
      }
      newRows[rowIndex].conversation.outputKey = newOutputKey;
      return newRows;
    });
  };

  const getNestedKeyPath = (obj, value, path = []) => {
    console.log("Inspecting path:", path.join('.'), "with value:", value);
    if (typeof obj !== 'object' || obj === null) {
      return null;
    }
  
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newPath = path.concat(key);
        if (obj[key] === value) {
          console.log("Found match at path:", newPath.join('.'));
          return newPath.join('.');
        } else if (typeof obj[key] === 'object') {
          const result = getNestedKeyPath(obj[key], value, newPath);
          if (result) return result;
        }
      }
    }
  
    return path.join('.'); // Fallback to return current path
  };

  return (
    <div className="parent-conversation-row" ref={ref} {...draggableProps}>
      <div className="drag-handle" {...dragHandleProps}>⋮</div>
      <button className="delete-row-button" onClick={() => handleDeleteRow(rowIndex)}>X</button>
      <div className="api-connection-form">
        <APIConnectionForm 
          initialValues={apiDetails} 
          onSave={onSaveAPIConnection}
          setOutputValue={(key, value) => handleSetOutput(key, value)}
          handleApiChange={handleApiChange}
          onApiResponse={(response) => handleApiResponse(rowIndex, response)}  // Use it here
          onFullApiResponse={(fullResponse) => handleApiResponse(rowIndex, fullResponse)}
        />
      </div>
      <div className="conversation-row">
        <div className="output-field-section">
          <label>Output Field:</label>
          <input 
            type="text" 
            value={conversation.outputKey || ''} 
            onChange={handleOutputKeyChange}
            placeholder="Key (set from API response or edit manually)"
          />
          <textarea 
            value={conversation.output || ''} 
            onChange={handleOutputChange}
            placeholder="Value (set from API response or edit manually)"
          />
        </div>
        <div className="conditions-section">
          {conversation.evaluations && conversation.evaluations.map((evaluation, conditionIndex) => (
            <div key={conditionIndex} className="condition-row">
              <select 
                value={evaluation || 'equals'} 
                onChange={(e) => handleEvaluationChange(conditionIndex, e.target.value)}
              >
                <option value="equals">Exact Match</option>
                <option value="contains">Contains</option>
                <option value="begins_with">Begins With</option>
                <option value="ends_with">Ends With</option>
                <option value="word_count">Word Count</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
              </select>
              <input 
                type="text" 
                value={conversation.phrases?.[conditionIndex] || ''} 
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

        {conversation.result !== null && (
          <div className={`result-section result-section-${rowIndex}`}>
            <span className={`result-indicator ${
              conversation.result === 'pass' ? 'pass' : 
              conversation.result === 'fail' ? 'fail' : ''
            }`}>
              {conversation.result === 'pass' || conversation.result === 'fail' ? capitalizeFirstLetter(conversation.result) : ''}
            </span>
          </div>
        )}

        <div className="latency-row">
          <span className="latency-label">Latency:</span>
          <span className="latency-value">
            {conversation.latency?.latency != null ? `${conversation.latency.latency} ms` : 'N/A'}
          </span>
        </div>
      </div>
      <hr />
    </div>
  );
});

export default ConversationRow;