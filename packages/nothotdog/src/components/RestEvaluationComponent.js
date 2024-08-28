import React, { useState, useEffect, useCallback } from 'react';
import '../components/EvaluationComponent';
import '../styles/Modal.css';
import '../styles/ApiTabs.css';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/AuthFetch';
import TestGroupSidebar from '../components/TestGroupSideBar';
import { SaveTestModal, SignInModal } from './UtilityModals';
import { useLocation } from 'react-router-dom';
import ApiTabs from './ApiTabs';


const RestEvaluationComponent = () => {
  const { user, signIn, projectId, userId } = useAuth();
  const { authFetch } = useAuthFetch();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [description, setDescription] = useState('');
  const [groupOptions, setGroupOptions] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [currentSavingIndex, setCurrentSavingIndex] = useState(null);
  const location = useLocation();
  const [isUpdate, setIsUpdate] = useState(false);


  useEffect(() => {
    const fetchGroups = async () => {
      try {
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


  const [tabs, setTabs] = useState([{
    name: 'API 1',
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
  }]);


  const handleGroupSelect = useCallback((group) => {
    setSelectedGroupId(group.id);
    const textInputs = group.inputs.filter(input => input.input_type === 'text');
    const newTabs = textInputs.map((input, index) => createTabFromInput(input, index));
    setTabs(newTabs.length > 0 ? newTabs : [{
      name: 'API 1',
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
    }]);
    setActiveTabIndex(0);
  }, []);

  const createTabFromInput = (input, index) => ({
    name: `API ${index + 1}`,
    api: {
      method: input.method || 'GET',
      url: input.url || '',
      headers: Object.entries(input.headers || {}).map(([key, value]) => ({ key, value })),
      queryParams: Object.entries(input.query_params || {}).map(([key, value]) => ({ key, value })),
      body: input.content || '',
    },
    conversation: {
      evaluations: input.checks ? input.checks.map(check => check.rule) : [],
      phrases: input.checks ? input.checks.map(check => check.value) : [],
      outputKeys: input.checks ? input.checks.map(check => check.field) : [],
      outputValues: [],
      result: null,
      latency: { startTime: null, latency: null },
    },
    apiResponse: null,
    uuid: input.uuid,
    description: input.description || '',
    groupId: input.groupId || '',
  });

  const handleApiResponse = useCallback((tabIndex, apiData) => {
    setTabs(prevTabs => {
      const newTabs = [...prevTabs];
      newTabs[tabIndex] = {
        ...newTabs[tabIndex],
        api: {
          method: apiData.method,
          url: apiData.url,
          headers: apiData.headers,
          queryParams: apiData.queryParams,
          body: apiData.body,
        },
        apiResponse: apiData.response,
      };
      return newTabs;
    });
  }, []);

  const handleApiChange = useCallback((tabIndex, field, value) => {
    setTabs(prevTabs => {
      if (tabIndex >= prevTabs.length) {
        console.error('Invalid tab index');
        return prevTabs;
      }
      const newTabs = [...prevTabs];
      if (!newTabs[tabIndex].api) {
        newTabs[tabIndex].api = {};
      }
      newTabs[tabIndex].api[field] = value;
      return newTabs;
    });
  }, []);

  const setOutputValue = useCallback((tabIndex, key, value) => {
    setTabs(prevTabs => {
      const newTabs = [...prevTabs];
      const tab = newTabs[tabIndex];
      const conversation = tab.conversation;
  
      // Update or add the output value
      const outputIndex = conversation.outputKeys.findIndex(k => k === key);
      if (outputIndex !== -1) {
        conversation.outputValues[outputIndex] = value;
      } else {
        conversation.outputKeys.push(key);
        conversation.outputValues.push(value);
      }
  
      // Update or add the evaluation
      const evalIndex = conversation.evaluations.findIndex(e => e.key === key);
      if (evalIndex !== -1) {
        conversation.evaluations[evalIndex] = { ...conversation.evaluations[evalIndex], key, value };
      } else {
        conversation.evaluations.push({ key, rule: 'Exact Match', value });
      }
  
      return newTabs;
    });
  }, []);

  const handleSave = async (tabIndex) => {
    if (!userId) {
      setShowSignInModal(true);
      return;
    }
    setCurrentSavingIndex(tabIndex);
    setDescription(tabs[tabIndex].description || '');
    setSelectedGroupId(tabs[tabIndex].groupId || '');
    setIsUpdate(!!tabs[tabIndex].uuid);
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async () => {
    if (currentSavingIndex === null) return;
    const tab = tabs[currentSavingIndex];

    const data = {
      description: description, // From the modal
      inputType: "text",
      content: JSON.stringify(tab.api?.body || {}),
      projectId,
      groupId: selectedGroupId || null, // From the modal dropdown
      checks: tab.conversation.evaluations.map(evaluation => ({
        field: evaluation.key,
        rule: evaluation.rule,
        value: evaluation.value
      })),
      url: tab.api?.url || '',
      apiType: "REST",
      method: tab.api?.method || 'GET',
      headers: tab.api?.headers || {},
      query_params: tab.api?.queryParams || {},
      content_type: "json"
    };

    try {
      const response = await authFetch(isUpdate ? `api/inputs/${tab.uuid}` : 'api/inputs', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response) {
        setDescription('');
        setShowSaveModal(false);
        setCurrentSavingIndex(null);
        alert(isUpdate ? 'Test updated successfully' : 'Test saved successfully');
        setTabs(prevTabs => {
          const newTabs = [...prevTabs];
          newTabs[currentSavingIndex] = {
            ...newTabs[currentSavingIndex],
            description: description,
            groupId: selectedGroupId,
            uuid: isUpdate ? tab.uuid : response.uuid // Assuming the API returns the new UUID for created tests
          };
          return newTabs;
        });
      } else {
        alert(isUpdate ? 'Failed to update the test' : 'Failed to save the test');
      }
    } catch (error) {
      console.error(isUpdate ? 'Error updating test:' : 'Error saving test:', error);
    }
  };

  const handleUpdateConfirm = async () => {
    if (currentSavingIndex === null) return;

    const tab = tabs[currentSavingIndex];

    const data = {
        description: description || '',
        inputType: "text",
        content: JSON.stringify(tab.api?.body || {}),
        projectId,
        groupId: selectedGroupId || null,
        checks: (tab.conversation.evaluations || []).map((evaluation, idx) => ({
            field: tab.conversation.outputKeys?.[idx] || '',
            rule: evaluation || 'exact_match',
            value: tab.conversation.phrases?.[idx] || '',
        })),
        url: tab.api?.url || '',
        apiType: "REST",
        method: tab.api?.method || 'GET',
        headers: tab.api?.headers || {},
        query_params: tab.api?.queryParams || {},
        content_type: "json"
    };

    try {
        const response = await authFetch(`api/inputs/${tab.uuid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response) {
            setDescription('');
            setShowSaveModal(false);
            setCurrentSavingIndex(null);
            alert('Test updated successfully');
        } else {
            alert('Failed to update the test', error);
        }
    } catch (error) {
        console.error('Error updating test:', error);
    }
  };

  const handleEvaluate = async (tabIndex) => {
    const tab = tabs[tabIndex];
    const evaluations = tab.conversation.evaluations;
    const apiResponse = tab.apiResponse;
  
    if (!apiResponse) {
      alert('No API response to evaluate. Please send a request first.');
      return;
    }
  
    if (!evaluations || evaluations.length === 0) {
      alert('No evaluations to perform. Please add at least one evaluation.');
      return;
    }
  
    const results = evaluations.map(evaluation => {
      if (!evaluation.key) {
        return false; // Skip evaluation if key is not defined
      }
      const actualValue = getValueFromPath(apiResponse.body, evaluation.key);
      return evaluateCondition(actualValue, evaluation.rule, evaluation.value);
    });
  
    setTabs(prevTabs => {
      const newTabs = [...prevTabs];
      newTabs[tabIndex].conversation.result = results.every(r => r) ? 'pass' : 'fail';
      return newTabs;
    });
  
    alert(`Evaluation complete. ${results.filter(r => r).length} out of ${results.length} checks passed.`);
  };

  // Helper functions for evaluation
  const getValueFromPath = (obj, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const evaluateCondition = (actual, rule, expected) => {
    switch (rule) {
      case 'Exact Match':
        return actual === expected;
      case 'Contains':
        return String(actual).includes(expected);
      case 'Begins With':
        return String(actual).startsWith(expected);
      case 'Ends With':
        return String(actual).endsWith(expected);
      case 'Word Count':
        return String(actual).split(/\s+/).length === Number(expected);
      case 'Less Than':
        return Number(actual) < Number(expected);
      // Add more conditions as needed
      default:
        return false;
    }
  };


return (
  <div className="evaluation-container">
    <TestGroupSidebar 
      testGroups={[]}
      onSelectGroup={handleGroupSelect}
      projectId={projectId}
      authFetch={authFetch} 
      userId={userId}
      onInputSelect={(input) => handleGroupSelect({ inputs: [input] })}
      onGroupSelect={handleGroupSelect}
      onTextGroupSelect={handleGroupSelect}
      componentType={'text'}
    />

    <div className="evaluation-component">
      <ApiTabs
        tabs={tabs}
        setTabs={setTabs}
        activeTabIndex={activeTabIndex}
        setActiveTabIndex={setActiveTabIndex}
        handleApiResponse={handleApiResponse}
        setOutputValue={setOutputValue}
        handleApiChange={handleApiChange}
        handleSave={handleSave}
        handleEvaluate={handleEvaluate}
      />

      <SaveTestModal
        showModal={showSaveModal}
        setShowModal={setShowSaveModal}
        description={description}
        setDescription={setDescription}
        isUpdate={isUpdate}
        groupOptions={groupOptions}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        saveTest={handleSaveConfirm}
        updateTest={handleUpdateConfirm}
      />
      <SignInModal
        showSignInModal={showSignInModal}
        setShowSignInModal={setShowSignInModal}
        signIn={signIn}
      />
    </div>
  </div>
);
};

export default RestEvaluationComponent;