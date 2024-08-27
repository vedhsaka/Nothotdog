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
  const [tabs, setTabs] = useState([]);
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

  useEffect(() => {
    if (tabs.length === 0) {
      setTabs([{
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
          phrases: [],
          outputValues: [],
          outputKeys: [],
          result: null,
          latency: { startTime: null, latency: null },
        },
        apiResponse: null,
      }]);
    }

    if (location.state && location.state.selectedGroup) {
      handleGroupSelect(location.state.selectedGroup);
    }
  }, []);

  const handleGroupSelect = useCallback((group) => {
    setSelectedGroupId(group.id);
    const textInputs = group.inputs.filter(input => input.input_type === 'text');
    setTabs(textInputs.map((input, index) => createTabFromInput(input, index)));
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
      const newTabs = [...prevTabs];
      newTabs[tabIndex] = {
        ...newTabs[tabIndex],
        api: {
          ...newTabs[tabIndex].api,
          [field]: value,
        },
      };
      return newTabs;
    });
  }, []);

  const setOutputValue = useCallback((tabIndex, key, value) => {
    setTabs(prevTabs => {
      const newTabs = [...prevTabs];
      const conversation = newTabs[tabIndex].conversation;
      const newIndex = conversation.outputKeys.length;
      conversation.outputKeys[newIndex] = key;
      conversation.outputValues[newIndex] = value;
      conversation.evaluations[newIndex] = 'exact_match';
      conversation.phrases[newIndex] = '';
      return newTabs;
    });
  }, []);

  const handleSaveConfirm = async () => {
    if (currentSavingIndex === null) return;
    const tab = tabs[currentSavingIndex];

    const data = {
      description: description, // From the modal
      inputType: "text",
      content: JSON.stringify(tab.api?.body || {}),
      projectId,
      groupId: selectedGroupId || null, // From the modal dropdown
      checks: tab.conversation.evaluations.map((evaluation, idx) => ({
        field: tab.conversation.outputKeys[idx] || '',
        rule: evaluation,
        value: tab.conversation.phrases[idx]
      })),
      url: tab.api?.url || '',
      apiType: "REST",
      method: tab.api?.method || 'GET',
      headers: tab.api?.headers || {},
      query_params: tab.api?.queryParams || {},
      content_type: "json"
    };

    try {
      const response = await authFetch('api/inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response) {
        setDescription('');
        setShowSaveModal(false);
        setCurrentSavingIndex(null);
        alert('Test saved successfully');
      } else {
        alert('Failed to save the test');
      }
    } catch (error) {
      console.error('Error saving test');
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