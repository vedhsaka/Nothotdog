import React, { useState, useEffect, useCallback } from 'react';
import './css/EvaluationComponent.css';
import './Components/Modal.css';
import { useAuth } from './AuthContext';
import useAuthFetch from './AuthFetch';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import TestGroupSidebar from './TestGroupSideBar';
import APIRequestForm from './APIConnectionForm';
import { SaveTestModal, SignInModal } from './UtilityModals';
import ConversationRow from './ConversationRow';
import { evaluationMapping } from './utils';  // Add this import at the top of the file
import StrictModeDroppable from './StrictModeDroppable';

const RestEvaluationComponent = () => {
  const { user, signIn, projectId, userId } = useAuth();
  const { authFetch } = useAuthFetch();
  const [rows, setRows] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [description, setDescription] = useState('');
  const [groupOptions, setGroupOptions] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const [currentSavingIndex, setCurrentSavingIndex] = useState(null);



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

  const handleGroupSelect = (group) => {
    setSelectedGroupId(group.id);
    clearConversationRows();
    group.inputs.filter(input => input.input_type === 'text').forEach(text => loadTextAsConversationRow(text));
  };

  // const handleApiResponse = (rowIndex, response) => {
  //   setRows(prev => {
  //     const newRows = [...prev];
  //     newRows[rowIndex] = {
  //       ...newRows[rowIndex],
  //       apiResponse: response,
  //       conversation: {
  //         ...newRows[rowIndex].conversation,
  //         output: response && response.body ? JSON.stringify(response.body, null, 2) : ''
  //       }
  //     };
  //     return newRows;
  //   });
  // };

  const handleEvaluate = async (index) => {
    const row = rows[index];
  
    try {
      let content = row.apiResponse ? row.apiResponse.body : {};
  
      const checks = row.conversation.evaluations.map((evaluation, idx) => ({
        field: row.conversation.outputValues[idx] || '',
        rule: evaluation,
        value: row.conversation.phrases[idx]
      }));
  
      const response = await authFetch('api/test-inputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputType: "text",
          content,
          checks
        }),
      });
  
      if (response) {
        setRows(prev => {
          const newRows = [...prev];
          newRows[index].conversation.result = response.test_result;
          return newRows;
        });
      } else {
        console.error('Failed to evaluate the test');
      }
    } catch (error) {
      console.error('Error during evaluation:', error);
    }
  };

  // const handleSave = async (index) => {
  //   if (!user) {
  //     setShowSignInModal(true);
  //     return;
  //   }

  //   const row = rows[index];

  //   const data = {
  //     description,
  //     inputType: "text",
  //     content: row.outputValue,
  //     projectId,
  //     groupId: selectedGroupId,
  //     checks: row.conditions.reduce((acc, condition) => {
  //       acc[evaluationMapping[condition.evaluationType]] = condition.phrase;
  //       return acc;
  //     }, {}),
  //     sequence: index + 1,
  //     url: row.api.url,
  //     apiType: "REST",
  //     method: row.api.method,
  //     headers: row.api.headers.reduce((acc, header) => ({ ...acc, [header.key]: header.value }), {}),
  //     query_params: row.api.queryParams.reduce((acc, param) => ({ ...acc, [param.key]: param.value }), {}),
  //     content_type: "application/json",
  //   };

  //   try {
  //     const response = await authFetch('api/inputs', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(data),
  //     });

  //     if (response) {
  //       console.log('Test saved successfully');
  //       setDescription('');
  //       setShowSaveModal(false);
  //     } else {
  //       console.error('Failed to save the test');
  //     }
  //   } catch (error) {
  //     console.error('Error saving test:', error);
  //   }
  // };

  const handleApiResponse = useCallback((rowIndex, apiData) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        api: {
          method: apiData.method,
          url: apiData.url,
          headers: apiData.headers,
          queryParams: apiData.queryParams,
          body: apiData.body,
        },
        apiResponse: apiData.response,
      };
      return newRows;
    });
  }, []);

  const handleSave = (index) => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    setCurrentSavingIndex(index);
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async () => {
    if (currentSavingIndex === null) return;
    const row = rows[currentSavingIndex];

    const data = {
      description: description, // From the modal
      inputType: "text",
      content: JSON.stringify(row.api?.body || {}),
      projectId,
      groupId: selectedGroupId, // From the modal dropdown
      checks: row.conversation.evaluations.map((evaluation, idx) => ({
        field: row.conversation.outputKeys[idx] || '',
        rule: evaluation,
        value: row.conversation.phrases[idx]
      })),
      sequence: currentSavingIndex + 1,
      url: row.api?.url || '',
      apiType: "REST",
      method: row.api?.method || 'GET',
      headers: row.api?.headers || {},
      query_params: row.api?.queryParams || {},
      content_type: "json"
    };

    try {
      const response = await authFetch('api/inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log('Test saved successfully');
        setDescription('');
        setShowSaveModal(false);
        setCurrentSavingIndex(null);
      } else {
        console.error('Failed to save the test');
      }
    } catch (error) {
      console.error('Error saving test:', error);
    }
  };

  const handleTextSelect = (text) => {
    clearConversationRows();
    loadTextAsConversationRow(text);
  };
  
  const loadTextAsConversationRow = (text) => {
    const checks = text.checks || {};
    const conditions = Object.entries(checks).map(([key, value]) => ({
      evaluationType: evaluationMapping[key] || 'exact_match',
      phrase: value,
    }));
    
    setRows([{
      api: {
        method: 'GET',
        url: text.url || '',
        headers: text.headers ? Object.entries(text.headers).map(([key, value]) => ({ key, value })) : [],
        queryParams: text.query_params ? Object.entries(text.query_params).map(([key, value]) => ({ key, value })) : [],
        body: '',
      },
      conditions,
      outputValue: text.content || '',
      outputKey: '',
      result: null,
      latency: { startTime: null, latency: null },
    }]);
  };

  const handleConditionChange = useCallback((rowIndex, conditionIndex, field, value) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex].conditions[conditionIndex][field] = value;
      return newRows;
    });
  }, []);

  const handleDeleteRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteCondition = useCallback((rowIndex, conditionIndex) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      const row = {...newRows[rowIndex]};
      if (row.conversation && Array.isArray(row.conversation.evaluations) && Array.isArray(row.conversation.phrases)) {
        row.conversation.evaluations = row.conversation.evaluations.filter((_, index) => index !== conditionIndex);
        row.conversation.phrases = row.conversation.phrases.filter((_, index) => index !== conditionIndex);
      }
      newRows[rowIndex] = row;
      return newRows;
    });
  }, []);

  const handleSetOutputValue = useCallback((rowIndex, key, value) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = {};
      }
      if (!newRows[rowIndex].conversation.outputKeys) {
        newRows[rowIndex].conversation.outputKeys = [];
      }
      if (!newRows[rowIndex].conversation.outputValues) {
        newRows[rowIndex].conversation.outputValues = [];
      }
      const index = newRows[rowIndex].conversation.outputKeys.length;
      newRows[rowIndex].conversation.outputKeys[index] = key;
      newRows[rowIndex].conversation.outputValues[index] = value;
      return newRows;
    });
  }, []);

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(rows);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRows(items);
  };

  const clearConversationRows = () => {
    setRows([]);
  };

  // const handleApiResponse = (response) => {
  //   setApiResponse(response);
  // };

  const addConversationRow = useCallback(() => {
    setRows(prev => [
      ...prev,
      {
        api: {
          method: 'GET',
          url: '',
          headers: [{ key: '', value: '' }],
          queryParams: [{ key: '', value: '' }],
          body: '',
        },
        conditions: [],
        outputKey: '',
        outputValue: '',
        result: null,
        latency: { startTime: null, latency: null },
        apiResponse: null,
      }
    ]);
  }, []);
  const addCondition = useCallback((rowIndex) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = {};
      }
      if (!Array.isArray(newRows[rowIndex].conversation.evaluations)) {
        newRows[rowIndex].conversation.evaluations = [];
      }
      if (!Array.isArray(newRows[rowIndex].conversation.phrases)) {
        newRows[rowIndex].conversation.phrases = [];
      }
      if (!Array.isArray(newRows[rowIndex].conversation.fields)) {
        newRows[rowIndex].conversation.fields = [];
      }
      if (!Array.isArray(newRows[rowIndex].conversation.outputKeys)) {
        newRows[rowIndex].conversation.outputKeys = [];
      }
      if (!Array.isArray(newRows[rowIndex].conversation.outputValues)) {
        newRows[rowIndex].conversation.outputValues = [];
      }
      newRows[rowIndex].conversation.evaluations.push('equals');
      newRows[rowIndex].conversation.phrases.push('');
      newRows[rowIndex].conversation.fields.push('');
      newRows[rowIndex].conversation.outputKeys.push('');
      newRows[rowIndex].conversation.outputValues.push('');
      return newRows;
    });
  }, []);

  const handlePhraseChange = useCallback((index, conditionIndex, value) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index].conversation.phrases[conditionIndex] = value;
      return newRows;
    });
  }, []);

  const handleTextGroupSelect = (inputs) => {
    clearConversationRows(); // Clear any existing rows

    inputs.forEach(input => {
        const newRow = createConversationRowFromInput(input);
        setRows(prevRows => [...prevRows, ...newRow]);
    });
};

const createConversationRowFromInput = (input) => {
  const apiDetails = {
      method: input.method || 'GET',
      url: input.url || '',
      headers: Object.entries(input.headers || {}).map(([key, value]) => ({ key, value })),
      queryParams: Object.entries(input.query_params || {}).map(([key, value]) => ({ key, value })),
      body: input.content || '',  // This maps to the request body
      contentType: input.content_type,
  };

  const newRow = {
      api: apiDetails,
      conversation: {
          evaluations: [],
          phrases: [],
          outputValues: [],
          result: null,
          latency: { startTime: null, latency: null },
      },
  };

  input.checks.forEach(check => {
      newRow.conversation.evaluations.push(check.rule);
      newRow.conversation.phrases.push(check.value);
      newRow.conversation.outputValues.push(check.field);
  });

  return [newRow];
};


  
  return (
    <div className="evaluation-container">
      <TestGroupSidebar 
        testGroups={[]}
        onSelectGroup={handleGroupSelect}
        projectId={projectId}
        authFetch={authFetch} 
        userId={userId}
        onInputSelect={handleTextSelect}
        onGroupSelect={handleGroupSelect}
        onTextGroupSelect={handleTextGroupSelect} // Pass the new handler 
      />

      <div className="evaluation-component">
        <hr />
        <div className="transcript-box">
          <h3>Conversations</h3>
          <button className="add-row-button" onClick={addConversationRow}>+</button>

          <DragDropContext onDragEnd={onDragEnd}>
            <StrictModeDroppable droppableId="droppable-conversations">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="conversations"
                >
                  {rows.map((rowData, index) => (
                    <Draggable key={`row-${index}`} draggableId={`row-${index}`} index={index}>
                      {(provided) => (
                        <ConversationRow
                          ref={provided.innerRef}
                          draggableProps={provided.draggableProps}
                          dragHandleProps={provided.dragHandleProps}
                          rowIndex={index}
                          rowData={rowData}
                          setRows={setRows}
                          handlePhraseChange={handlePhraseChange}
                          handleDeleteRow={handleDeleteRow}
                          handleDeleteCondition={handleDeleteCondition}
                          addCondition={addCondition}
                          handleEvaluate={handleEvaluate}
                          handleSave={handleSave}
                          setOutputValue={handleSetOutputValue}
                          handleApiResponse={handleApiResponse}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </div>
        <SaveTestModal
          showModal={showSaveModal}
          setShowModal={setShowSaveModal}
          description={description}
          setDescription={setDescription}
          saveTest={handleSaveConfirm}
          groupOptions={groupOptions}
          selectedGroupId={selectedGroupId}
          setSelectedGroupId={setSelectedGroupId}
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