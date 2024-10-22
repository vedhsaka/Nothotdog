import React, { useState, useCallback } from 'react';
import '../components/EvaluationComponent';
import '../styles/Modal.css';
import '../styles/ApiTabs.css';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/AuthFetch';
import TestGroupSidebar from '../components/TestGroupSideBar';
import { SaveTestModal, SignInModal } from './UtilityModals';
import { evaluateTest } from './TestEvaluationHandler';
import ApiTabs from './ApiTabs';
import useSaveTest from '../hooks/useSaveTest';


const RestEvaluationComponent = () => {
  const { user, signIn, projectId, userId } = useAuth();
  const { authFetch } = useAuthFetch();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabs, setTabs] = useState([createEmptyTab()]);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false); // Track visibility

  const {
    showSaveModal,
    setShowSaveModal,
    showSignInModal,
    setShowSignInModal,
    description,
    setDescription,
    groupOptions,
    selectedGroupId,
    setSelectedGroupId,
    currentSavingIndex,
    setCurrentSavingIndex,
    isUpdate,
    handleSave
  } = useSaveTest();


  const hideMessageAfterDelay = () => {
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
      setSuccessMessage('');
      setApiErrorMessage('');
    }, 3000);
  };

  function createEmptyTab(index) {
    return {
      name: `API 1`,
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
  }

  const createTabFromInput = (input) => ({
    name: input.description || 'API Test',
    api: {
      method: input.method || 'GET',
      url: input.url || '',
      headers: input.headers ? Object.entries(input.headers).map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }],
      queryParams: input.query_params ? Object.entries(input.query_params).map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }],
      body: input.content || '',
    },
    conversation: {
      evaluations: input.checks ? input.checks.map(check => ({
        key: check.field,
        rule: check.rule,
        value: check.value,
        passed: check.passed || null
      })) : [],
      outputKeys: input.checks ? input.checks.map(check => check.field) : [],
      outputValues: input.checks ? input.checks.map(check => check.value) : [],
      result: null,
      latency: { startTime: null, latency: null },
    },
    apiResponse: null,
    uuid: input.uuid,
    description: input.description || '',
    groupId: input.groupId || '',
  });



  const handleGroupSelect = useCallback((group) => {
    setSelectedGroupId(group.id);
    // const textInputs = group.inputs.filter(input => input.input_type === 'text');
    // const newTabs = textInputs.map((input, index) => createTabFromInput(input, index));
    // setTabs(newTabs.length > 0 ? newTabs : [{
    //   name: 'API 1',
    //   api: {
    //     method: 'GET',
    //     url: '',
    //     headers: [{ key: '', value: '' }],
    //     queryParams: [{ key: '', value: '' }],
    //     body: '',
    //   },
    //   conversation: {
    //     evaluations: [],
    //     outputKeys: [],
    //     outputValues: [],
    //     result: null,
    //     latency: { startTime: null, latency: null },
    //   },
    //   apiResponse: null,
    // }]);
    // setActiveTabIndex(0);
  }, []);

  const isTabEmpty = (tab) => {
    return !tab || (tab.api.url === '' && tab.conversation.evaluations.length === 0);
  };

  const handleInputSelect = (input) => {
    setTabs(prevTabs => {
      const existingTabIndex = prevTabs.findIndex(tab => tab.uuid === input.uuid);
      const newTab = createTabFromInput(input);
  
      if (existingTabIndex !== -1) {
        // Update existing tab
        const updatedTabs = [...prevTabs];
        updatedTabs[existingTabIndex] = newTab;
        setActiveTabIndex(existingTabIndex);
        return updatedTabs;
      } else if (isTabEmpty(prevTabs[activeTabIndex])) {
        // Replace current empty tab
        const updatedTabs = [...prevTabs];
        updatedTabs[activeTabIndex] = newTab;
        return updatedTabs;
      } else {
        // Add new tab
        setActiveTabIndex(prevTabs.length);
        return [...prevTabs, newTab];
      }
    });
  };

  const handleAddNewTab = () => {
    setTabs(prevTabs => [...prevTabs, createEmptyTab()]);
    setActiveTabIndex(tabs.length);
  };

  const handleApiResponse = useCallback((tabIndex, apiData) => {
    setTabs(prevTabs => {
      const newTabs = [...prevTabs];
      const headersArray = Object.entries(apiData.headers).map(([key, value]) => ({
        key,
        value
      }));
      
      // Transform queryParams object into an array of objects
      const queryParamsArray = Object.entries(apiData.queryParams).map(([key, value]) => ({
        key,
        value
      }));
      
      newTabs[tabIndex] = {
        ...newTabs[tabIndex],
        api: {
          method: apiData.method,
          url: apiData.url,
          headers: headersArray,
          queryParams: queryParamsArray,
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
        conversation.evaluations.push({ key, rule: 'equals', value });
      }
  
      return newTabs;
    });
  }, []);

  // const handleSave = async (tabIndex) => {
  //   if (!userId) {
  //     setShowSignInModal(true);
  //     return;
  //   }
  //   setCurrentSavingIndex(tabIndex);
  //   setDescription(tabs[tabIndex].description || '');
  //   setSelectedGroupId(tabs[tabIndex].groupId || '');
  //   setIsUpdate(!!tabs[tabIndex].uuid);
  //   setShowSaveModal(true);
  // };

  const handleSaveConfirm = async () => {
    if (currentSavingIndex === null) return;
    const tab = tabs[currentSavingIndex];

    const data = {
      description: description, 
      inputType: "text",
      content: JSON.stringify(tab.api?.body || {}),
      projectId,
      groupId: selectedGroupId || null,
      checks: tab.conversation.evaluations.map(evaluation => ({
        field: evaluation.key,
        rule: evaluation.rule,
        value: evaluation.value
      })),
      url: tab.api?.url || '',
      apiType: "REST",
      method: tab.api?.method || 'GET',
      headers: Object.entries(tab.api?.headers || {}).reduce((acc, [key, value]) => {
        if (key && value) acc[key] = value;
        return acc;
      }, {}),
      query_params: Object.entries(tab.api?.queryParams || {}).reduce((acc, [key, value]) => {
        if (key && value) acc[key] = value;
        return acc;
      }, {}),
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
        setSuccessMessage(isUpdate ? 'Test updated successfully' : 'Test saved successfully');
        setApiErrorMessage('');  // Clear error message if operation was successful
        hideMessageAfterDelay();
        setTabs(prevTabs => {
          const newTabs = [...prevTabs];
          newTabs[currentSavingIndex] = {
            ...newTabs[currentSavingIndex],
            description: description,
            groupId: selectedGroupId,
            uuid: isUpdate ? tab.uuid : response.uuid
          };
          return newTabs;
        });
      } else {
        const errorData = await response.json(); // Assuming API response is JSON
        const apiErrorMessage = errorData?.message || 'Failed to save or update the test'; // Fallback error message
        setApiErrorMessage(apiErrorMessage);
        setSuccessMessage(''); // Clear success message if operation failed
        hideMessageAfterDelay();
      }
    } catch (error) {
      console.error(isUpdate ? 'Error updating test:' : 'Error saving test:', error);
      const errorMessage = error?.response?.message || 'An error occurred while saving the test';
      setApiErrorMessage(errorMessage);
      setSuccessMessage(''); // Clear success message if an error occurs
      hideMessageAfterDelay();
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

    try {
      const checks = evaluations.map((evaluation) => ({
        field: evaluation.key,
        rule: evaluation.rule,
        value: evaluation.value,
      }));
      const response = await evaluateTest(apiResponse.body, checks, "text", authFetch);

      if (response && response.test_result) {
        setTabs(prevTabs => {
          const newTabs = [...prevTabs];
          newTabs[tabIndex].conversation.result = response.test_result;
          newTabs[tabIndex].conversation.evaluations = newTabs[tabIndex].conversation.evaluations.map((evaluation, idx) => ({
            ...evaluation,
            passed: response.checks[idx].passed
          }));
          return newTabs;
        });
      } else {
        alert('Failed to evaluate the test or received unexpected response format');
      }
    } catch (error) {
      console.error('Error during evaluation:', error);
      alert('An error occurred during evaluation');
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
      // onInputSelect={(input) => handleGroupSelect({ inputs: [input] })}
      onInputSelect={handleInputSelect}
      onGroupSelect={handleGroupSelect}
      onTextGroupSelect={handleGroupSelect}
      componentType={'text'}
    />

    <div className="evaluation-component">
      {successMessage && (
        <div className="message-container success-message" style={{ color: 'green', marginBottom: '10px' }}>
          {successMessage}
          <span className="close-message" onClick={() => setSuccessMessage('')}>×</span>
        </div>
      )}

      {/* Error Message */}
      {apiErrorMessage && (
        <div className="message-container api-error-message" style={{ color: 'red', marginBottom: '10px' }}>
          {apiErrorMessage}
          <span className="close-message" onClick={() => setApiErrorMessage('')}>×</span>
        </div>
      )}
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
        handleAddNewTab={handleAddNewTab}
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