import React from 'react';
import APIRequestForm from './APIConnectionForm';
import '../styles/ApiTabs.css';

const ApiTabs = ({ 
  tabs, 
  setTabs, 
  activeTabIndex, 
  setActiveTabIndex, 
  handleApiResponse, 
  setOutputValue, 
  handleApiChange,
  handleSave,
  handleEvaluate
}) => {
  if (tabs.length === 0) {
    return null; // or return some placeholder content
  }
  const addNewTab = () => {
    const newTab = {
      name: `API ${tabs.length + 1}`,
      api: {
        method: 'GET',
        url: '',
        headers: [{ key: '', value: '' }],
        queryParams: [{ key: '', value: '' }],
        body: '',
      },
      conversation: {
        evaluations: [],
        outputKeys: [],
        outputValues: [],
        result: null,
        latency: { startTime: null, latency: null },
      },
      apiResponse: null,
    };
    setTabs([...tabs, newTab]);
    setActiveTabIndex(tabs.length);
  };

  const closeTab = (index, event) => {
    event.stopPropagation();
    if (tabs.length <= 1) {
      return; // Don't close the last tab
    }
    const newTabs = tabs.filter((_, i) => i !== index);
    setTabs(newTabs);
    if (activeTabIndex >= newTabs.length) {
      setActiveTabIndex(newTabs.length - 1);
    } else if (index < activeTabIndex) {
      setActiveTabIndex(prevIndex => prevIndex - 1);
    }
  };

  const switchTab = (index) => {
    setActiveTabIndex(index);
  };

  return (
    <div className="api-tabs">
      <div className="tab-bar">
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={`tab ${activeTabIndex === index ? 'active' : ''}`}
            onClick={() => switchTab(index)}
          >
            {tab.name}
            {tabs.length > 1 && (
              <button className="close-tab" onClick={(e) => closeTab(index, e)}>×</button>
            )}
          </div>
        ))}
        <button className="add-tab" onClick={addNewTab}>+</button>
      </div>
      <div className="tab-content">
        {tabs[activeTabIndex] && (
          <div>
            <APIRequestForm
              key={`form-${activeTabIndex}`}
              initialValues={tabs[activeTabIndex].api}
              onApiResponse={(apiData) => handleApiResponse(activeTabIndex, apiData)}
              setOutputValue={(key, value) => setOutputValue(activeTabIndex, key, value)}
              onFullApiResponse={(fullResponse) => handleApiResponse(activeTabIndex, fullResponse)}
              handleApiChange={(field, value) => handleApiChange(activeTabIndex, field, value)}
              evaluations={tabs[activeTabIndex].conversation.evaluations}
              setEvaluations={(newEvaluations) => {
                const newTabs = [...tabs];
                newTabs[activeTabIndex].conversation.evaluations = newEvaluations;
                setTabs(newTabs);
              }}
            />
            <div className="tab-actions">
              <button onClick={() => handleSave(activeTabIndex)}>Save</button>
              <button onClick={() => handleEvaluate(activeTabIndex)}>Evaluate</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTabs;