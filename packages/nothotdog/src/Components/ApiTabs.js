import React, { useState } from 'react';
import APIConnectionForm from './APIConnectionForm';
import '../styles/ApiTabs.css';

const ApiTabs = ({ rows, setRows, handleApiResponse, handlePhraseChange, handleDeleteRow, setOutputValue, handleDeleteCondition, addCondition, handleEvaluate, handleSave, handleUpdate, isUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);

  const addNewTab = () => {
    setRows([...rows, {
      api: {
        method: 'GET',
        url: '',
        headers: [{ key: '', value: '' }],
        queryParams: [{ key: '', value: '' }],
        body: '',
      },
      conversation: {
        evaluations: [],
        phrases: [],
        outputValues: [],
        result: null,
        latency: { startTime: null, latency: null },
      },
      apiResponse: null,
    }]);
    setActiveTab(rows.length);
  };

  const closeTab = (index) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
    if (activeTab >= newRows.length) {
      setActiveTab(newRows.length - 1);
    }
  };

  return (
    <div className="api-tabs">
      <div className="tab-bar">
        {rows.map((_, index) => (
          <div
            key={index}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            API {index + 1}
            <button className="close-tab" onClick={(e) => { e.stopPropagation(); closeTab(index); }}>×</button>
          </div>
        ))}
        <button className="add-tab" onClick={addNewTab}>+</button>
      </div>
      <div className="tab-content">
        {rows[activeTab] && (
            <APIRequestForm
                initialValues={rows[activeTab].api}
                onApiResponse={(apiData) => handleApiResponse(activeTab, apiData)}
                setOutputValue={(key, value) => setOutputValue(activeTab, key, value)}
                onFullApiResponse={(fullResponse) => handleApiResponse(activeTab, fullResponse)}
                handleApiChange={(field, value) => {
                    const newRows = [...rows];
                    newRows[activeTab].api[field] = value;
                    setRows(newRows);
                }}
            />
        )}
      </div>
    </div>
  );
};

export default ApiTabs;