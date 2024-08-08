import React, { useState, useEffect } from 'react';
import { Send, Loader, Plus } from 'lucide-react';
import './css/ApiConnections.css';

const APIRequestForm = ({ onApiResponse, setOutputValue }) => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [params, setParams] = useState([{ key: '', value: '' }]);
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodePath, setSelectedNodePath] = useState('');
  const [activeTab, setActiveTab] = useState('params');

  const cleanValue = (value) => {
    let cleanedValue = value.replace(/^["'](.+(?=["']$))["']$/, '$1');
    cleanedValue = cleanedValue.replace(/,$/, '');
    return cleanedValue;
  };

  useEffect(() => {
    if (method === 'POST') {
      setHeaders((prevHeaders) => {
        const contentTypeHeader = prevHeaders.find((h) => h.key.toLowerCase() === 'content-type');
        if (contentTypeHeader) {
          return prevHeaders.map((h) =>
            h.key.toLowerCase() === 'content-type' ? { ...h, value: 'application/json' } : h
          );
        } else {
          return [...prevHeaders, { key: 'Content-Type', value: 'application/json' }];
        }
      });
    }
  }, [method]);

  const addParam = () => setParams([...params, { key: '', value: '' }]);
  const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);

  const updateParam = (index, field, value) => {
    const newParams = [...params];
    newParams[index][field] = value;
    setParams(newParams);
  };

  const updateHeader = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
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

      const requestHeaders = new Headers();
      headers.forEach((header) => {
        if (header.key && header.value) {
          requestHeaders.append(header.key, header.value);
        }
      });

      const requestOptions = {
        method: method,
        headers: requestHeaders,
      };

      if (method === 'POST' || method === 'GET') {
        requestOptions.body = body;
      }

      const response = await fetch(urlWithParams.toString(), requestOptions);

      const contentType = response.headers.get('content-type');
      let responseData;
      if (contentType && contentType.indexOf('application/json') !== -1) {
        responseData = await response.json();
        if (onApiResponse) onApiResponse(responseData);
      } else {
        responseData = await response.text();
      }

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData,
      });
    } catch (error) {
      setResponse({
        error: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetOutputValue = (value, path) => {
    setSelectedNodePath(path);
    const cleanedValue = cleanValue(value);
    if (typeof cleanedValue === 'object') {
      setOutputValue(JSON.stringify(cleanedValue));
    } else {
      setOutputValue(cleanedValue);
    }
  };

  return (
    <div className="api-request-form">
      <div className="request-line">
        <select className="method-select" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option>GET</option>
          <option>POST</option>
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
          <div className="section params-section api-form">
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
              </div>
            ))}
            <button className="add-button" onClick={addParam}>
              <Plus size={14} /> Add Param
            </button>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="section headers-section api-form">
            <h3>Headers</h3>
            {headers.map((header, index) => (
              <div key={index} className="input-group">
                <input
                  className="input"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder="Key"
                />
                <input
                  className="input"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  placeholder="Value"
                />
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
                <p className="error">Error: {response.error}</p>
              ) : (
                <>
                  <p className="status">Status: {response.status} {response.statusText}</p>
                  <div className="response-details">
                    <h4>Headers:</h4>
                    <pre>{JSON.stringify(response.headers, null, 2)}</pre>
                    <h4>Body:</h4>
                    <pre>
                      {typeof response.body === 'object'
                        ? JSON.stringify(response.body, null, 2).split('\n').map((line, index) => {
                            const match = line.match(/"(.+)":\s(.+)/);
                            if (match) {
                              const [_, key, value] = match;
                              return (
                                <div
                                  key={index}
                                  className="response-line"
                                  onMouseEnter={() => (document.getElementById(`set-output-btn-${index}`).style.display = 'inline')}
                                  onMouseLeave={() => (document.getElementById(`set-output-btn-${index}`).style.display = 'none')}
                                >
                                  {line}
                                  <button
                                    id={`set-output-btn-${index}`}
                                    className="set-output-btn"
                                    style={{ display: 'none', marginLeft: '2px' }}
                                    onClick={() => handleSetOutputValue(value.trim(), key)}
                                  >
                                    Set as Output
                                  </button>
                                </div>
                              );
                            }
                            return <div key={index}>{line}</div>;
                          })
                        : response.body}
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
    </div>
  );
};

export default APIRequestForm;
