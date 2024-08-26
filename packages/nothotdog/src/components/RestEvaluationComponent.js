import React, { useState, useEffect, useCallback } from 'react';
import '../components/EvaluationComponent';
import '../styles/Modal.css';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/AuthFetch';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import TestGroupSidebar from '../components/TestGroupSideBar';
import { SaveTestModal, SignInModal } from './UtilityModals';
import ConversationRow from './ConversationRow';
import { evaluationMapping } from '../utils/utils';  // Add this import at the top of the file
import StrictModeDroppable from './StrictModeDroppable';
import { useLocation } from 'react-router-dom';
const RestEvaluationComponent = () => {
  const { user, signIn, projectId, userId } = useAuth();
  const { authFetch } = useAuthFetch();
  const [rows, setRows] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [description, setDescription] = useState('');
  const [groupOptions, setGroupOptions] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [currentSavingIndex, setCurrentSavingIndex] = useState(null);
  const location = useLocation();
  const [isUpdate, setIsUpdate] = useState(false); // New state to track if we're updating


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

  useEffect(() => {
    if (rows.length === 0) {
      addConversationRow();  // Add a default conversation row when the component first loads
    }
  
    if (location.state && location.state.selectedGroup) {
      handleGroupSelect(location.state.selectedGroup);
    }
  }, []);  // Add rows.length as a dependency
  

  const handleEvaluate = async (index) => {
    const row = rows[index];
  
    try {
      let content = row.apiResponse ? row.apiResponse.body : {};
  
      const checks = row.conversation.evaluations.map((evaluation, idx) => ({
        field: row.conversation.outputKeys[idx] || '',
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
      groupId: selectedGroupId || null, // From the modal dropdown
      checks: row.conversation.evaluations.map((evaluation, idx) => ({
        field: row.conversation.outputKeys[idx] || '',
        rule: evaluation,
        value: row.conversation.phrases[idx]
      })),
      // sequence: currentSavingIndex + 1,
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

      if (response) {
        setDescription('');
        setShowSaveModal(false);
        setCurrentSavingIndex(null);
        alert('Test saved successfully');
      } else {
        alert('Failed to save the test', error);
      }
    } catch (error) {
      console.error('Error saving test:', error);
    }
  };

  const handleUpdate = (index) => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    const row = rows[index];
    setCurrentSavingIndex(index);
    setDescription(row.description || ''); // Set the description from the existing test
    setSelectedGroupId(row.groupId || null); // Set the group ID from the existing test
    setShowSaveModal(true);
  };

  const handleUpdateConfirm = async () => {
    if (currentSavingIndex === null) return;

    const row = rows[currentSavingIndex];

    const data = {
        description: description || '', // Use a fallback if description is undefined
        inputType: "text",
        content: JSON.stringify(row.api?.body || {}),
        projectId,
        groupId: selectedGroupId || null, // Use a fallback if selectedGroupId is undefined
        checks: (row.conversation.evaluations || []).map((evaluation, idx) => ({
            field: row.conversation.outputKeys?.[idx] || '',  // Use optional chaining to prevent undefined errors
            rule: evaluation || 'exact_match',  // Default to 'exact_match' if evaluation is undefined
            value: row.conversation.phrases?.[idx] || '',  // Use optional chaining to prevent undefined errors
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
        const response = await authFetch(`api/inputs/${row.uuid}`, {
            method: 'PUT', // PUT for update
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
      uuid: text.uuid,
      description: text.description || '',
      groupId: text.groupId || null,
      conditions,
      outputValue:'',
      outputKey: text.content || '',
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

  const handleDeleteCondition = (rowIndex, conditionIndex) => {
    setRows(prev => {
      const newRows = [...prev];
      const conversation = newRows[rowIndex].conversation;
  
      if (conversation && conversation.outputKeys && conversation.outputValues && conversation.evaluations) {
        // Remove the condition at the specific index
        conversation.outputKeys.splice(conditionIndex, 1);
        conversation.outputValues.splice(conditionIndex, 1);
        conversation.evaluations.splice(conditionIndex, 1);
        
        // Remove the phrase associated with the condition, if it exists
        if (conversation.phrases) {
          conversation.phrases.splice(conditionIndex, 1);
        }
  
        // Update the conversation in the row
        newRows[rowIndex].conversation = conversation;
      }
  
      return newRows;
    });
  };
  

  const handleSetOutputValue = useCallback((rowIndex, key, value) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      
      // Ensure the conversation object and relevant arrays are initialized
      if (!newRows[rowIndex].conversation) {
        newRows[rowIndex].conversation = {};
      }
      if (!Array.isArray(newRows[rowIndex].conversation.outputKeys)) {
        newRows[rowIndex].conversation.outputKeys = [];
      }
      if (!Array.isArray(newRows[rowIndex].conversation.outputValues)) {
        newRows[rowIndex].conversation.outputValues = [];
      }
      if (!Array.isArray(newRows[rowIndex].conversation.evaluations)) {
        newRows[rowIndex].conversation.evaluations = [];
      }
      if (!Array.isArray(newRows[rowIndex].conversation.phrases)) {
        newRows[rowIndex].conversation.phrases = [];
      }
  
      // Always create a new entry
      const newIndex = newRows[rowIndex].conversation.outputKeys.length;
      newRows[rowIndex].conversation.outputKeys[newIndex] = key;
      newRows[rowIndex].conversation.outputValues[newIndex] = value;
      newRows[rowIndex].conversation.evaluations[newIndex] = 'exact_match'; // Or the default evaluation type
      newRows[rowIndex].conversation.phrases[newIndex] = ''; // Or the default phrase value
      
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

  const handleTextGroupSelect = (group) => {
    clearConversationRows(); // Clear any existing rows
    group.inputs.forEach(input => {
      const newRow = createConversationRowFromInput(input);
      setRows(prevRows => [...prevRows, ...newRow]);
    });
};


const createConversationRowFromInput = (input) => {

  if (input.uuid) {
    setIsUpdate(true); // Set isUpdate to true when creating a new row
  } else {
    setIsUpdate(false); // Set isUpdate to false when creating a new row
  }
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
          outputKeys: [],
          result: null,
          latency: { startTime: null, latency: null },
      },
      uuid: input.uuid,
      description: input.description || '',
      groupId: input.groupId || '',
  };

  input.checks.forEach(check => {
      newRow.conversation.evaluations.push(check.rule);
      newRow.conversation.phrases.push(check.value);
      newRow.conversation.outputKeys.push(check.field);
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
        componentType={'text'}
      />

      <div className="evaluation-component">
        <hr />
        <div className="transcript-box">
          <button className="add-row-button" onClick={addConversationRow}>+ New API</button>

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
                          handleUpdate={handleUpdate} // Pass the handleUpdate function
                          isUpdate={isUpdate} // Pass the isUpdate state
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
          isUpdate={isUpdate} // Pass the isUpdate state
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
