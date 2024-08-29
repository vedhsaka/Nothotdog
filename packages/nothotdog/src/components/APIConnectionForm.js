import React, { useState, useEffect } from 'react';
import { Send, Loader, Plus, X } from 'lucide-react';
import './../styles/ApiConnections.css';
import axios from 'axios';

const APIRequestForm = ({ onApiResponse, setOutputValue, onFullApiResponse, initialValues, handleApiChange, evaluations, setEvaluations }) => {
  const [method, setMethod] = useState(initialValues?.method || 'GET');
  const [url, setUrl] = useState(initialValues?.url || '');
  const [params, setParams] = useState(initialValues?.queryParams || [{ key: '', value: '' }]);
  const [headers, setHeaders] = useState(initialValues?.headers || [{ key: '', value: '' }]);
  const [body, setBody] = useState(() => {
    try {
      return JSON.stringify(JSON.parse(initialValues?.body || '{}'), null, 2);
    } catch (e) {
      console.error('Invalid initial JSON body:', e);
      return '{}';
    }
  });
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('params');

  useEffect(() => {
    handleApiChange('method', method);
  }, [method, handleApiChange]);

  useEffect(() => {
    handleApiChange('url', url);
  }, [url, handleApiChange]);

  useEffect(() => {
    handleApiChange('queryParams', params);
  }, [params, handleApiChange]);

  useEffect(() => {
    handleApiChange('headers', headers);
  }, [headers, handleApiChange]);

  useEffect(() => {
    handleApiChange('body', body);
  }, [body, handleApiChange]);

  const addParam = () => setParams([...params, { key: '', value: '' }]);
  const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);

  const removeParam = (index) => {
    const newParams = params.filter((_, i) => i !== index);
    setParams(newParams.length > 0 ? newParams : [{ key: '', value: '' }]);
  };

  const removeHeader = (index) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    setHeaders(newHeaders.length > 0 ? newHeaders : [{ key: '', value: '' }]);
  };

  const updateParam = (index, field, value) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: value };
    setParams(newParams);
  };

  const updateHeader = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const sendRequest = async () => {
    setIsLoading(true);
    setResponse(null);

    try {
      const urlWithParams = new URL(url);
      params.forEach((param) => {
        if (param.key && param.value) {
          urlWithParams.searchParams.append(param.key, param.value);
        }
      });

      const requestConfig = {
        method: method,
        url: urlWithParams.toString(),
        headers: headers.reduce((acc, header) => {
          if (header.key && header.value) {
            acc[header.key] = header.value;
          }
          return acc;
        }, {}),
      };

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          requestConfig.data = JSON.parse(body);
        } catch (e) {
          console.error('Invalid JSON in request body:', e);
          setResponse({ error: 'Invalid JSON in request body' });
          setIsLoading(false);
          return;
        }
      }

      const axiosResponse = await axios(requestConfig);

      const fullResponse = {
        status: axiosResponse.status,
        statusText: axiosResponse.statusText,
        headers: axiosResponse.headers,
        body: axiosResponse.data,
      };

      setResponse(fullResponse);

      if (onApiResponse) {
        onApiResponse({
          method,
          url: urlWithParams.toString(),
          headers: requestConfig.headers,
          queryParams: Object.fromEntries(urlWithParams.searchParams.entries()),
          body: requestConfig.data,
          response: fullResponse
        });
      }

      if (onFullApiResponse) {
        onFullApiResponse({
          method,
          url: urlWithParams.toString(),
          headers: requestConfig.headers,
          queryParams: Object.fromEntries(urlWithParams.searchParams.entries()),
          body: requestConfig.data,
          response: fullResponse
        });
      }
    } catch (error) {
      setResponse({
        error: error.message,
        ...(error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          body: error.response.data
        } : {})
      });
    } finally {
      setIsLoading(false);
      setActiveTab('response');
    }
  };

  const handleSetOutputValue = (key, value) => {
    setOutputValue(key, value);
    const existingEvalIndex = evaluations.findIndex(evaluations => evaluations.key === key);
    if (existingEvalIndex !== -1) {
      const updatedEvaluations = [...evaluations];
      updatedEvaluations[existingEvalIndex].value = value;
      setEvaluations(updatedEvaluations);
    } else {
      setEvaluations([...evaluations, { key, rule: 'Exact Match', value }]);
    }
  };

  const updateEvaluation = (index, field, value) => {
    const updatedEvaluations = [...evaluations];
    updatedEvaluations[index] = { ...updatedEvaluations[index], [field]: value };
    setEvaluations(updatedEvaluations);
  };

  const removeEvaluation = (index) => {
    setEvaluations(evaluations.filter((_, i) => i !== index));
  };

  const renderJsonWithSelectableKeys = (json, path = '') => {
    if (json === null || json === undefined) {
      return <span className="json-value">null</span>;
    }

    if (typeof json !== 'object') {
      return <span className="json-value">{JSON.stringify(json)}</span>;
    }

    if (Array.isArray(json)) {
      return (
        <div className="json-array">
          [
          {json.map((item, index) => (
            <div key={index} className="json-array-item">
              {renderJsonWithSelectableKeys(item, path ? `${path}.${index}` : `${index}`)}
              {index < json.length - 1 && ','}
            </div>
          ))}
          ]
        </div>
      );
    }

    return (
      <div className="json-object">
        {'{'}
        {Object.entries(json).map(([key, value], index) => (
          <div key={key} className="json-line">
            <span className="json-key">"{key}":</span>{' '}
            {renderJsonWithSelectableKeys(value, path ? `${path}.${key}` : key)}
            <button
              className="set-output-btn"
              onClick={() => handleSetOutputValue(path ? `${path}.${key}` : key, value)}
            >
              Set as Output
            </button>
            {index < Object.keys(json).length - 1 && ','}
          </div>
        ))}
        {'}'}
      </div>
    );
  };

  return (
    <div className="api-request-form">
      <div className="request-line">
        <select className="method-select" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
          <option>PATCH</option>
        </select>
        <input
          type="text"
          className="url-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
        />
        <button className="send-button" onClick={sendRequest} disabled={isLoading}>
          {isLoading ? <Loader className="animate-spin" /> : <>Send <Send /></>}
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'params' ? 'active' : ''}`} onClick={() => setActiveTab('params')}>Query Params</button>
        <button className={`tab ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers</button>
        <button className={`tab ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>Request Body</button>
        <button className={`tab ${activeTab === 'response' ? 'active' : ''}`} onClick={() => setActiveTab('response')}>Response</button>
      </div>

      <div className="tab-content">
        {activeTab === 'params' && (
          <div className="section params-section">
            <h3>Query Params</h3>
            {params.map((param, index) => (
              <div key={index} className="input-group">
                <input
                  className="input key"
                  value={param.key}
                  onChange={(e) => updateParam(index, 'key', e.target.value)}
                  placeholder="Key"
                />
                <input
                  className="input value"
                  value={param.value}
                  onChange={(e) => updateParam(index, 'value', e.target.value)}
                  placeholder="Value"
                />
                <button className="remove-button" onClick={() => removeParam(index)}>
                  <X size={14} />
                </button>
              </div>
            ))}
            <button className="add-button" onClick={addParam}>
              <Plus size={14} /> Add Param
            </button>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="section headers-section">
            <h3>Headers</h3>
            {headers.map((header, index) => (
              <div key={index} className="input-group">
                <input
                  className="input key"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder="Key"
                />
                <input
                  className="input value"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  placeholder="Value"
                />
                <button className="remove-button" onClick={() => removeHeader(index)}>
                  <X size={14} />
                </button>
              </div>
            ))}
            <button className="add-button" onClick={addHeader}>
              <Plus size={14} /> Add Header
            </button>
          </div>
        )}

        {activeTab === 'body' && (
          <div className="section body-section">
            <h3>Request Body</h3>
            <textarea
              className="body-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter request body (JSON)"
            />
          </div>
        )}

        {activeTab === 'response' && (
          <div className="section response-section">
            <h3>Response</h3>
            {response ? (
              response.error ? (
                <div>
                  <p className="error">Error: {response.error}</p>
                  {response.status && <p>Status: {response.status} {response.statusText}</p>}
                  {response.headers && (
                    <div>
                      <h4>Headers:</h4>
                      <pre>{JSON.stringify(response.headers, null, 2)}</pre>
                    </div>
                  )}
                  {response.body && (
                    <div>
                      <h4>Body:</h4>
                      <pre className="json-response">
                        {renderJsonWithSelectableKeys(response.body)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="status">Status: {response.status} {response.statusText}</p>
                  <div className="response-details">
                    <h4>Headers:</h4>
                    <pre>{JSON.stringify(response.headers, null, 2)}</pre>
                    <h4>Body:</h4>
                    <pre className="json-response">
                      {renderJsonWithSelectableKeys(response.body)}
                    </pre>
                  </div>
                </>
              )
            ) : (
              <p>No response yet</p>
            )}
          </div>
        )}
      </div>

      <div className="evaluations-section">
        <h3>Evaluations</h3>
        {evaluations.map((evaluation, index) => (
          <div key={index} className="evaluation-row">
            <input
              type="text"
              value={evaluation.key}
              onChange={(e) => updateEvaluation(index, 'key', e.target.value)}
              placeholder="Key"
            />
            <select
              value={evaluation.rule}
              onChange={(e) => updateEvaluation(index, 'rule', e.target.value)}
            >
              <option value="Exact Match">Exact Match</option>
              <option value="Contains">Contains</option>
              <option value="Begins With">Begins With</option>
              <option value="Ends With">Ends With</option>
              <option value="Word Count">Word Count</option>
              <option value="Contextually Contains">Contextually Contains</option>
              <option value="Less Than">Less Than</option>
            </select>
            <input
              type="text"
              value={evaluation.value}
              onChange={(e) => updateEvaluation(index, 'value', e.target.value)}
              placeholder="Expected Value"
            />
            <button onClick={() => removeEvaluation(index)}>Remove</button>
          </div>
        ))}
        <button onClick={() => setEvaluations([...evaluations, { key: '', rule: 'Exact Match', value: '' }])}>
          Add Evaluation
        </button>
      </div>
    </div>
  );
};

export default APIRequestForm;