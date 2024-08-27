import React from 'react';
import { capitalizeFirstLetter } from '../utils/utils';
import '../styles/ConversationRow.css';
import APIConnectionForm from '../components/APIConnectionForm';

const ConversationRow = React.forwardRef(({
  rowIndex,
  rowData,
  setRows,
  handleApiResponse,
  handlePhraseChange,
  handleDeleteRow,
  setOutputValue,
  handleDeleteCondition,
  addCondition,
  handleEvaluate,
  handleSave,
  dragHandleProps,
  draggableProps,
  isUpdate,
  handleUpdate
}, ref) => {
  const apiDetails = rowData?.apiDetails || {};
  const conversation = rowData?.conversation || { evaluations: [], phrases: [], fields: [], outputKeys: [], outputValues: [] };

  const onSaveAPIConnection = (apiData) => {
    handleApiResponse(rowIndex, apiData);
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

  const handleOutputKeyChange = (conditionIndex, newValue) => {
    setRows(prev => {
      const newRows = [...prev];
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = { outputKeys: [] };
      }
      if (!newRows[rowIndex].conversation.outputKeys) {
        newRows[rowIndex].conversation.outputKeys = [];
      }
      newRows[rowIndex].conversation.outputKeys[conditionIndex] = newValue;
      return newRows;
    });
  };

  const handleOutputValueChange = (conditionIndex, newValue) => {
    setRows(prev => {
      const newRows = [...prev];
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = { outputValues: [] };
      }
      if (!newRows[rowIndex].conversation.outputValues) {
        newRows[rowIndex].conversation.outputValues = [];
      }
      newRows[rowIndex].conversation.outputValues[conditionIndex] = newValue;
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
    setRows(prev => {
      const newRows = [...prev];
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = {};
      }
      if (!newRows[rowIndex].conversation.outputKeys) {
        newRows[rowIndex].conversation.outputKeys = [];
      }
      if (!newRows[rowIndex].conversation.outputValues) {
        newRows[rowIndex].conversation.outputValues = [];
      }
      if (!newRows[rowIndex].conversation.evaluations) {
        newRows[rowIndex].conversation.evaluations = [];
      }
      if (!newRows[rowIndex].conversation.phrases) {
        newRows[rowIndex].conversation.phrases = [];
      }
      
      let index = newRows[rowIndex].conversation.outputKeys.indexOf(keyPath);
      index = newRows[rowIndex].conversation.outputKeys.length;
      newRows[rowIndex].conversation.evaluations.push('equals');
      newRows[rowIndex].conversation.phrases.push('');
      
      newRows[rowIndex].conversation.outputKeys[index] = keyPath;
      newRows[rowIndex].conversation.outputValues[index] = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      return newRows;
    });
  };

  const handleFieldChange = (conditionIndex, newValue) => {
    setRows(prev => {
      const newRows = [...prev];
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = { fields: [] };
      }
      if (!newRows[rowIndex].conversation.fields) {
        newRows[rowIndex].conversation.fields = [];
      }
      newRows[rowIndex].conversation.fields[conditionIndex] = newValue;
      return newRows;
    });
  };

  return (
    <div className="parent-conversation-row" ref={ref} {...draggableProps}>
    <div className="drag-handle" {...dragHandleProps}>⋮</div>
      <button className="delete-row-button" onClick={() => handleDeleteRow(rowIndex)}>X</button>
      <div className="api-connection-form">
        <APIConnectionForm 
          initialValues={rowData.api}  // Ensure this prop is correctly set
          onApiResponse={onSaveAPIConnection}
          onSave={onSaveAPIConnection}
          setOutputValue={(key, value) => handleSetOutput(key, value)}
          handleApiChange={handleApiChange}
          onFullApiResponse={(fullResponse) => handleApiResponse(rowIndex, fullResponse)}
        />
      </div>
      <div className="conversation-row">
        <div className="conditions-section">
          {conversation.evaluations && conversation.evaluations.map((evaluation, conditionIndex) => (
            <div key={conditionIndex} className="condition-row">
            <div className="output-field-section">
              <input 
                className='output-key-input'
                type="text" 
                value={conversation.outputKeys?.[conditionIndex] || ''} 
                onChange={(e) => handleOutputKeyChange(conditionIndex, e.target.value)}
                placeholder="Key (set from API response or edit manually)"
              />
              <textarea 
                className='output-value-input'
                value={conversation.outputValues?.[conditionIndex] || ''}
                onChange={(e) => handleOutputValueChange(conditionIndex, e.target.value)}
                placeholder="Value (set from API response or edit manually)"
              />
            </div>
            <select 
              value={evaluation || 'equals'} 
              onChange={(e) => handleEvaluationChange(conditionIndex, e.target.value)}
            >
              <option value="equals">Exact Match</option>
              <option value="contains">Contains</option>
              <option value="starts_with">Begins With</option>
              <option value="ends_with">Ends With</option>
              <option value="word_count">Word Count</option>
              <option value="context_match">Contextually Contains</option>
              <option value="less_than">Less Than</option>
            </select>
            <input 
              type="text" 
              value={conversation.phrases?.[conditionIndex] || ''} 
              onChange={(e) => handlePhraseChange(rowIndex, conditionIndex, e.target.value)} 
              placeholder="Expected Value"
            />
            <button className="delete-condition-button" onClick={() => handleDeleteCondition(rowIndex, conditionIndex)}>X</button>
          </div>          
          ))}
          <button className="add-condition-button" onClick={() => addCondition(rowIndex)}>Add Condition</button>
        </div>

        <div className="evaluate-section">
          <button className="button primary" onClick={() => handleEvaluate(rowIndex)}>Evaluate</button>

          {isUpdate ? (
          <button 
            className="button semi-primary" 
            onClick={() => handleUpdate(rowIndex)}>
            Update
          </button>
        ) : (
          <button 
            className="button semi-primary" 
            onClick={() => handleSave(rowIndex)}>
            Save
          </button>
        )}
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