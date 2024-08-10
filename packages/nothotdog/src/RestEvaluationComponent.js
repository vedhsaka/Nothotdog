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
import NodeSelectionModal from './NodeSelectionModal';

const RestEvaluationComponent = () => {
  const { user, signIn, projectId, userId } = useAuth();
  const authFetch = useAuthFetch();
  const [rows, setRows] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [description, setDescription] = useState('');
  const [groupOptions, setGroupOptions] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [jsonResponse, setJsonResponse] = useState(null);
  const [selectedNodePath, setSelectedNodePath] = useState('');
  const [selectedNodeValue, setSelectedNodeValue] = useState('');
  const [showNodeSelectionModal, setShowNodeSelectionModal] = useState(false);

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

  const handleEvaluate = async (index) => {
    const row = rows[index];
  
    try {
      const checks = {};
  
      row.conversation.evaluations.forEach((evalType, idx) => {
        checks[evaluationMapping[evalType]] = row.conversation.phrases[idx];
      });
  
      const response = await authFetch('api/test-inputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: row.conversation.output,
          checks,
          inputType: "text"
        }),
      });
  
      if (response) {
        const result = response;
        setRows(prev => {
          const newRows = [...prev];
          newRows[index].conversation.result = result.test_result; // Assuming the API returns a "test_result" field with "Pass" or "Fail"
          return newRows;
        });
      } else {
        console.error('Failed to evaluate the test');
      }
    } catch (error) {
      console.error('Error during evaluation:', error);
    }
  };

  const handleSave = async (index) => {
    if (!user) {
      setSelectedIndex(index);
      setShowSignInModal(true);
      return;
    }

    const row = rows[index];

    const data = {
      description,
      inputType: "text",
      content: row.conversation.input,
      projectId,
      groupId: selectedGroupId,
      checks: row.conversation.evaluations.reduce((acc, evalType, idx) => {
        acc[evaluationMapping[evalType]] = row.conversation.phrases[idx];
        return acc;
      }, {}),
      sequence: index + 1,
      url: row.api.url,
      apiType: "REST",
      method: row.api.method,
      headers: row.api.headers.reduce((acc, header) => ({ ...acc, [header.key]: header.value }), {}),
      query_params: row.api.queryParams.reduce((acc, param) => ({ ...acc, [param.key]: param.value }), {}),
      content_type: "application/json",
    };

    try {
      const response = await authFetch('api/inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response) {
        console.log('Test saved successfully');
        setDescription('');
        setShowSaveModal(false);
      } else {
        console.error('Failed to save the test');
      }
    } catch (error) {
      console.error('Error saving test:', error);
    }
  };

  const addConversationRow = () => {
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
        conversation: {
          input: '',
          output: '',
          evaluations: [],
          phrases: [],
          result: null,
          latency: { startTime: null, latency: null },
        },
      }
    ]);
  };

  const handleTextSelect = (text) => {
    clearConversationRows();
    loadTextAsConversationRow(text);
  };
  
  const loadTextAsConversationRow = (text) => {
    const textId = Date.now() + Math.random(); // Generate a unique ID
    const checks = text.checks || {};
    const evaluationTypes = Object.keys(checks).map(key => {
      const mappedType = evaluationMapping[key];
      return mappedType || 'exact_match'; // Default to 'exact_match' if no mapping found
    });
    const phraseValues = Object.values(checks);
    
    // Update state arrays with text content
    updateStateArrays(textId, text.content, null, evaluationTypes, phraseValues, null);
  };

  const handlePhraseChange = useCallback((index, conditionIndex, value) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index].conversation.phrases[conditionIndex] = value;
      return newRows;
    });
  }, []);

  const handleDeleteRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteCondition = (rowIndex, conditionIndex) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex].conversation.evaluations.splice(conditionIndex, 1);
      newRows[rowIndex].conversation.phrases.splice(conditionIndex, 1);
      return newRows;
    });
  };

  const addCondition = (index) => {
    setRows(prev => {
      const newRows = [...prev];
      if (!Array.isArray(newRows[index].conversation.evaluations)) {
        newRows[index].conversation.evaluations = [];
      }
      newRows[index].conversation.evaluations.push('');
      newRows[index].conversation.phrases.push('');
      return newRows;
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorder = (list, startIndex, endIndex) => {
      const result = Array.from(list);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    };

    setRows(prev => reorder(prev, result.source.index, result.destination.index));
  };

  const clearConversationRows = () => {
    setRows([]);
  };

  const handleApiResponse = (response) => {
    setJsonResponse(response);
  };

  const handleSetOutputValue = (value) => {
    setSelectedNodeValue(value);
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[newRows.length - 1].conversation.output = value;
      return newRows;
    });
  };
  
  return (
    <div className="evaluation-container">
      <TestGroupSidebar 
        testGroups={[]} // You may need to fetch and pass the actual test groups
        onSelectGroup={handleGroupSelect}
        projectId={projectId}
        authFetch={authFetch} 
        userId={userId}
        onInputSelect={handleTextSelect}
        onGroupSelect={handleGroupSelect} 
      />
      <NodeSelectionModal
        showModal={showNodeSelectionModal}
        setShowModal={setShowNodeSelectionModal}
        jsonResponse={jsonResponse}
        setSelectedNodePath={setSelectedNodePath}
        setSelectedNodeValue={setSelectedNodeValue}
      />

      <div className="evaluation-component">
        {/* <APIRequestForm 
          // Assume these props are passed to the last added row
          url={rows[rows.length - 1]?.api.url || ''}
          authToken={rows[rows.length - 1]?.api.authToken || ''}
          queryParams={rows[rows.length - 1]?.api.queryParams || []}
          bodyParams={rows[rows.length - 1]?.api.body || ''}
          setUrl={(url) => setRows(prevRows => {
            const newRows = [...prevRows];
            newRows[newRows.length - 1].api.url = url;
            return newRows;
          })}
          setAuthToken={(token) => setRows(prevRows => {
            const newRows = [...prevRows];
            newRows[newRows.length - 1].api.authToken = token;
            return newRows;
          })}
          setQueryParams={(params) => setRows(prevRows => {
            const newRows = [...prevRows];
            newRows[newRows.length - 1].api.queryParams = params;
            return newRows;
          })}
          setBodyParams={(body) => setRows(prevRows => {
            const newRows = [...prevRows];
            newRows[newRows.length - 1].api.body = body;
            return newRows;
          })}
          connected={connected}
          setConnected={setConnected}
          error={error}
          onApiResponse={handleApiResponse}
          setOutputValue={handleSetOutputValue}
        /> */}
        <hr />
        <div className="transcript-box">
          <h3>Conversations</h3>
          <button className="add-row-button" onClick={addConversationRow}>+</button>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable-conversations">
              {(provided) => (
                <div
                  className="conversations"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {rows.map((rowData, rowIndex) => (
                    <Draggable
                      key={rowIndex}
                      draggableId={`input-${rowIndex}`}
                      index={rowIndex}
                    >
                      {(provided) => (
                        <ConversationRow
                          rowIndex={rowIndex}
                          rowData={rowData}
                          setRows={setRows}
                          handlePhraseChange={handlePhraseChange}
                          handleDeleteRow={handleDeleteRow}
                          handleDeleteCondition={handleDeleteCondition}
                          addCondition={addCondition}
                          handleEvaluate={handleEvaluate}
                          handleSave={handleSave}
                          dragHandleProps={provided.dragHandleProps}
                          draggableProps={provided.draggableProps}
                          ref={provided.innerRef}
                          setOutputValue={handleSetOutputValue}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <SaveTestModal
          showModal={showSaveModal}
          setShowModal={setShowSaveModal}
          description={description}
          setDescription={setDescription}
          saveTest={handleSave}
          groupOptions={groupOptions}
          selectedGroupId={selectedGroupId}
          setSelectedGroupId={setSelectedGroupId}
        />
        <SignInModal
          showSignInModal={showSignInModal}
          setShowSignInModal={setShowSignInModal}
          signIn={signIn}
        />

        {selectedNodePath && (
          <div className="selected-node-info">
            <p>Selected Node: {selectedNodePath}</p>
            <p>Value: {selectedNodeValue}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestEvaluationComponent;