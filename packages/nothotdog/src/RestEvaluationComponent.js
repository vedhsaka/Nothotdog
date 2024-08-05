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
import { capitalizeFirstLetter, evaluationMapping } from './utils';

const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

const RestEvaluationComponent = () => {
  const { user, signIn, projectId, userId } = useAuth();
  const authFetch = useAuthFetch();
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [bodyParams, setBodyParams] = useState('{}');
  const [queryParams, setQueryParams] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [description, setDescription] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [phrases, setPhrases] = useState([]);
  const [results, setResults] = useState([]);
  const [latencies, setLatencies] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    clearConversationRows();
    group.inputs.filter(input => input.input_type === 'text').forEach(text => loadTextAsConversationRow(text));
  };
  const handleEvaluate = async (index) => {
    const evaluation = evaluations[index];
    const phrase = phrases[index];
    const outputText = outputs[index];
  
    try {
      const checks = {};
  
      evaluation.forEach((evalType, idx) => {
        checks[evaluationMapping[evalType]] = phrase[idx];
      });
  
      const response = await authFetch('api/test-inputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: outputText,
          checks,
          inputType: "text"
        }),
      });
  
      if (response) {
        const result = response;
        const newResults = [...results];
  
        newResults[index] = result.test_result; // Assuming the API returns a "test_result" field with "Pass" or "Fail"
        setResults(newResults);
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
    setSelectedIndex(index);
    setDescription('');
    setShowSaveModal(true);
  };

  const saveTest = async () => {
    if (description.trim() === '' || selectedIndex === null) {
      alert('Please provide a description and select a test to save.');
      return;
    }

    const checks = {};
    evaluations[selectedIndex].forEach((evalType, idx) => {
      checks[evaluationMapping[evalType]] = phrases[selectedIndex][idx];
    });

    const data = {
      description,
      content: inputs[selectedIndex],
      projectId,
      checks,
      type: "text",
      sequence: Number(selectedIndex + 1)
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
    setPhrases(prevPhrases => {
      const newPhrases = [...prevPhrases];
      newPhrases[index][conditionIndex] = value;
      return newPhrases;
    });
  }, []);

  const handleDeleteRow = (index) => {
    setInputs(prev => prev.filter((_, i) => i !== index));
    setOutputs(prev => prev.filter((_, i) => i !== index));
    setEvaluations(prev => prev.filter((_, i) => i !== index));
    setPhrases(prev => prev.filter((_, i) => i !== index));
    setResults(prev => prev.filter((_, i) => i !== index));
    setLatencies(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteCondition = (rowIndex, conditionIndex) => {
    setEvaluations(prevEvaluations => {
      const newEvaluations = [...prevEvaluations];
      newEvaluations[rowIndex].splice(conditionIndex, 1);
      return newEvaluations;
    });
    setPhrases(prevPhrases => {
      const newPhrases = [...prevPhrases];
      newPhrases[rowIndex].splice(conditionIndex, 1);
      return newPhrases;
    });
  };

  const addCondition = (index) => {
    setEvaluations(prev => {
      const newEvaluations = [...prev];
      if (!Array.isArray(newEvaluations[index])) {
        newEvaluations[index] = [];
      }
      newEvaluations[index] = [...newEvaluations[index], ''];
      return newEvaluations;
    });
    setPhrases(prev => {
      const newPhrases = [...prev];
      if (!Array.isArray(newPhrases[index])) {
        newPhrases[index] = [];
      }
      newPhrases[index] = [...newPhrases[index], ''];
      return newPhrases;
    });
  };

  const addConversationRow = () => {
    updateStateArrays('', null, [], [], null);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorder = (list, startIndex, endIndex) => {
      const result = Array.from(list);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    };

    setInputs(prev => reorder(prev, result.source.index, result.destination.index));
    setOutputs(prev => reorder(prev, result.source.index, result.destination.index));
    setEvaluations(prev => reorder(prev, result.source.index, result.destination.index));
    setPhrases(prev => reorder(prev, result.source.index, result.destination.index));
    setResults(prev => reorder(prev, result.source.index, result.destination.index));
    setLatencies(prev => reorder(prev, result.source.index, result.destination.index));
  };

  const updateStateArrays = (id, inputText, outputText, evaluation, phrase, result) => {
    setInputs(prev => [...prev, inputText]);
    setOutputs(prev => [...prev, outputText]);
    setEvaluations(prev => [...prev, evaluation]);
    setPhrases(prev => [...prev, phrase]);
    setResults(prev => [...prev, result]);
    setLatencies(prev => [...prev, { startTime: null, latency: null }]);
  };
  
  const clearConversationRows = () => {
    setInputs([]);
    setOutputs([]);
    setEvaluations([]);
    setPhrases([]);
    setResults([]);
    setLatencies([]);
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
      />
      <div className="evaluation-component">
        <APIRequestForm 
          url={url}
          authToken={authToken}
          queryParams={queryParams}
          bodyParams={bodyParams}
          setUrl={setUrl}
          setAuthToken={setAuthToken}
          setQueryParams={setQueryParams}
          setBodyParams={setBodyParams}
          connected={connected}
          setConnected={setConnected}
          error={error}
        />
        <hr />
        <div className="transcript-box">
          <h3>Conversations</h3>
          <button className="add-row-button" onClick={addConversationRow}>+</button>
          <DragDropContext onDragEnd={onDragEnd}>
            <StrictModeDroppable droppableId="droppable-conversations">
              {(provided) => (
                <div
                  className="conversations"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {inputs.map((input, rowIndex) => (
                    <Draggable
                      key={rowIndex}
                      draggableId={`input-${rowIndex}`}
                      index={rowIndex}
                    >
                      {(provided) => (
                        <ConversationRow
                          rowIndex={rowIndex}
                          input={input}
                          output={outputs[rowIndex]}
                          setInputs={setInputs}
                          setOutputs={setOutputs}
                          evaluations={evaluations}
                          setEvaluations={setEvaluations}
                          phrases={phrases}
                          setPhrases={setPhrases}
                          handlePhraseChange={handlePhraseChange}
                          handleDeleteRow={handleDeleteRow}
                          handleDeleteCondition={handleDeleteCondition}
                          addCondition={addCondition}
                          handleEvaluate={handleEvaluate}
                          handleSave={handleSave}
                          results={results}
                          latencies={latencies}
                          dragHandleProps={provided.dragHandleProps}
                          draggableProps={provided.draggableProps}
                          ref={provided.innerRef}
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
          saveTest={saveTest}
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