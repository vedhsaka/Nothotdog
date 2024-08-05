// import React, { useState } from 'react';
// import { Send, Eye, EyeOff, Loader } from 'lucide-react';
// import './css/ApiConnections.css';

// const APIConnectionForm = () => {
//   const [method, setMethod] = useState('POST');
//   const [url, setUrl] = useState('http://localhost:8000/api/test-voice');
//   const [activeTab, setActiveTab] = useState('Headers');
//   const [params, setParams] = useState([{ key: '', value: '', description: '' }]);
//   const [headers, setHeaders] = useState([
//     { key: 'Cache-Control', value: 'no-cache', description: '', enabled: true },
//     { key: 'Postman-Token', value: '<calculated when request is sent>', description: '', enabled: true },
//     { key: 'Content-Type', value: 'application/json', description: '', enabled: true },
//     { key: 'Content-Length', value: '<calculated when request is sent>', description: '', enabled: true },
//     { key: 'Host', value: '<calculated when request is sent>', description: '', enabled: true },
//     { key: 'User-Agent', value: 'PostmanRuntime/7.40.0', description: '', enabled: true },
//   ]);
//   const [bodyType, setBodyType] = useState('raw');
//   const [bodyFormat, setBodyFormat] = useState('JSON');
//   const [bodyContent, setBodyContent] = useState('');
//   const [showAutoHeaders, setShowAutoHeaders] = useState(true);
//   const [response, setResponse] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);

//   const addParam = () => {
//     setParams([...params, { key: '', value: '', description: '' }]);
//   };

//   const updateParam = (index, field, value) => {
//     const newParams = [...params];
//     newParams[index][field] = value;
//     setParams(newParams);
//   };

//   const addHeader = () => {
//     setHeaders([...headers, { key: '', value: '', description: '', enabled: true }]);
//   };

//   const updateHeader = (index, field, value) => {
//     const newHeaders = [...headers];
//     newHeaders[index][field] = value;
//     setHeaders(newHeaders);
//   };

//   const toggleHeaderEnabled = (index) => {
//     const newHeaders = [...headers];
//     newHeaders[index].enabled = !newHeaders[index].enabled;
//     setHeaders(newHeaders);
//   };

//   const sendRequest = async () => {
//     setIsLoading(true);
//     setResponse(null);
//     try {
//       console.log("Preparing to send request...");

//       // Prepare headers
//       const requestHeaders = new Headers();
//       headers.forEach(header => {
//         if (header.enabled && header.key && header.value) {
//           requestHeaders.append(header.key, header.value);
//         }
//       });
//       console.log("Headers prepared:", Object.fromEntries(requestHeaders.entries()));

//       // Prepare body
//       let requestBody;
//       if (bodyType === 'raw') {
//         console.log("Raw body content:", bodyContent);
//         switch (bodyFormat) {
//           case 'JSON':
//             try {
//               requestBody = JSON.parse(bodyContent);
//               console.log("Parsed JSON body:", requestBody);
//             } catch (error) {
//               console.error("Error parsing JSON body:", error);
//               throw new Error("Invalid JSON in request body");
//             }
//             break;
//           case 'Text':
//             requestBody = bodyContent;
//             break;
//           default:
//             requestBody = bodyContent;
//         }
//       } else if (bodyType === 'form-data') {
//         requestBody = new FormData();
//         try {
//           const formData = JSON.parse(bodyContent);
//           Object.keys(formData).forEach(key => {
//             requestBody.append(key, formData[key]);
//           });
//           console.log("Form data prepared:", Object.fromEntries(requestBody.entries()));
//         } catch (error) {
//           console.error("Error parsing form data:", error);
//           throw new Error("Invalid form data");
//         }
//       }

//       // Prepare URL with query params
//       const urlWithParams = new URL(url);
//       params.forEach(param => {
//         if (param.key && param.value) {
//           urlWithParams.searchParams.append(param.key, param.value);
//         }
//       });
//       console.log("URL with params:", urlWithParams.toString());

//       // Send request
//       console.log("Sending request...");
//       const response = await fetch(urlWithParams.toString(), {
//         method: method,
//         headers: requestHeaders,
//         body: requestBody,
//       });
//       console.log("Response received:", response);

//       // Parse response
//       let responseData;
//       const contentType = response.headers.get("content-type");
//       if (contentType && contentType.indexOf("application/json") !== -1) {
//         responseData = await response.json();
//       } else {
//         responseData = await response.text();
//       }
//       console.log("Parsed response data:", responseData);

//       setResponse({
//         status: response.status,
//         statusText: response.statusText,
//         headers: Object.fromEntries(response.headers.entries()),
//         body: responseData,
//       });
//     } catch (error) {
//       console.error("Error in sendRequest:", error);
//       setResponse({
//         error: error.message,
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="postman-like-form">
//       <div className="request-line">
//         <select
//           className="method-select"
//           value={method}
//           onChange={(e) => setMethod(e.target.value)}
//         >
//           <option>GET</option>
//           <option>POST</option>
//           <option>PUT</option>
//           <option>DELETE</option>
//         </select>
//         <input
//           type="text"
//           className="url-input"
//           value={url}
//           onChange={(e) => setUrl(e.target.value)}
//         />
//         <button className="send-button" onClick={sendRequest} disabled={isLoading}>
//             {isLoading ? <Loader className="animate-spin" size={16} /> : <>Send <Send className="send-icon" size={16} /></>}
//         </button>
//       </div>

//       <div className="tabs">
//         {['Params', 'Authorization', 'Headers', 'Body'].map((tab) => (
//           <button
//             key={tab}
//             className={`tab-button ${activeTab === tab ? 'active' : ''}`}
//             onClick={() => setActiveTab(tab)}
//           >
//             {tab}
//           </button>
//         ))}
//       </div>

//       {activeTab === 'Params' && (
//         <div className="params-section">
//           <h3 className="section-title">Query Params</h3>
//           <div className="param-headers">
//             <div>Key</div>
//             <div>Value</div>
//             <div>Description</div>
//           </div>
//           {params.map((param, index) => (
//             <div key={index} className="param-inputs">
//               <input
//                 className="param-input"
//                 value={param.key}
//                 onChange={(e) => updateParam(index, 'key', e.target.value)}
//                 placeholder="Key"
//               />
//               <input
//                 className="param-input"
//                 value={param.value}
//                 onChange={(e) => updateParam(index, 'value', e.target.value)}
//                 placeholder="Value"
//               />
//               <input
//                 className="param-input"
//                 value={param.description}
//                 onChange={(e) => updateParam(index, 'description', e.target.value)}
//                 placeholder="Description"
//               />
//             </div>
//           ))}
//           <button className="add-param-button" onClick={addParam}>
//             Add query param
//           </button>
//         </div>
//       )}

//       {activeTab === 'Headers' && (
//         <div className="headers-section">
//           <div className="headers-actions">
//             <button className="toggle-auto-headers" onClick={() => setShowAutoHeaders(!showAutoHeaders)}>
//               {showAutoHeaders ? <Eye size={16} /> : <EyeOff size={16} />} Hide auto-generated headers
//             </button>
//             <button className="bulk-edit">Bulk Edit</button>
//             <select className="presets-select">
//               <option>Presets</option>
//             </select>
//           </div>
//           <div className="headers-table">
//             <div className="headers-row headers-header">
//               <div></div>
//               <div>Key</div>
//               <div>Value</div>
//               <div>Description</div>
//               <div></div>
//             </div>
//             {headers.map((header, index) => (
//               <div key={index} className="headers-row">
//                 <input
//                   type="checkbox"
//                   checked={header.enabled}
//                   onChange={() => toggleHeaderEnabled(index)}
//                 />
//                 <input
//                   className="header-input"
//                   value={header.key}
//                   onChange={(e) => updateHeader(index, 'key', e.target.value)}
//                   placeholder="Key"
//                 />
//                 <input
//                   className="header-input"
//                   value={header.value}
//                   onChange={(e) => updateHeader(index, 'value', e.target.value)}
//                   placeholder="Value"
//                 />
//                 <input
//                   className="header-input"
//                   value={header.description}
//                   onChange={(e) => updateHeader(index, 'description', e.target.value)}
//                   placeholder="Description"
//                 />
//                 <div className="header-actions">
//                   {header.key === 'Content-Type' && <span className="go-to-settings">Go to settings</span>}
//                 </div>
//               </div>
//             ))}
//           </div>
//           <button className="add-header-button" onClick={addHeader}>
//             Add header
//           </button>
//         </div>
//       )}

//       {activeTab === 'Body' && (
//         <div className="body-section">
//           <div className="body-type-options">
//             {['none', 'form-data', 'x-www-form-urlencoded', 'raw', 'binary'].map((type) => (
//               <label key={type} className="radio-label">
//                 <input
//                   type="radio"
//                   value={type}
//                   checked={bodyType === type}
//                   onChange={() => setBodyType(type)}
//                   className="radio-input"
//                 />
//                 {type}
//               </label>
//             ))}
//           </div>
//           {bodyType === 'raw' && (
//             <div className="body-format">
//               <select
//                 className="body-format-select"
//                 value={bodyFormat}
//                 onChange={(e) => setBodyFormat(e.target.value)}
//               >
//                 <option>Text</option>
//                 <option>JavaScript</option>
//                 <option>JSON</option>
//                 <option>HTML</option>
//                 <option>XML</option>
//               </select>
//             </div>
//           )}
//           <textarea
//             className="body-textarea"
//             value={bodyContent}
//             onChange={(e) => setBodyContent(e.target.value)}
//             placeholder="Enter request body"
//           />
//         </div>
//       )}

// {response && (
//         <div className="response-section">
//           <h3>Response</h3>
//           {response.error ? (
//             <p className="error">Error: {response.error}</p>
//           ) : (
//             <>
//               <p>Status: {response.status} {response.statusText}</p>
//               <h4>Headers:</h4>
//               <pre>{JSON.stringify(response.headers, null, 2)}</pre>
//               <h4>Body:</h4>
//               <pre>{typeof response.body === 'object' ? JSON.stringify(response.body, null, 2) : response.body}</pre>
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default APIConnectionForm;



import React, { useState, useEffect } from 'react';
import { Send, Loader, Plus } from 'lucide-react';
import './css/ApiConnections.css';

const APIRequestForm = () => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [params, setParams] = useState([{ key: '', value: '' }]);
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (method === 'POST') {
      setHeaders(prevHeaders => {
        const contentTypeHeader = prevHeaders.find(h => h.key.toLowerCase() === 'content-type');
        if (contentTypeHeader) {
          return prevHeaders.map(h => 
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
      // Prepare URL with query params
      const urlWithParams = new URL(url);
      params.forEach(param => {
        if (param.key && param.value) {
          urlWithParams.searchParams.append(param.key, param.value);
        }
      });

      // Prepare headers
      const requestHeaders = new Headers();
      headers.forEach(header => {
        if (header.key && header.value) {
          requestHeaders.append(header.key, header.value);
        }
      });

      // Prepare request options
      const requestOptions = {
        method: method,
        headers: requestHeaders,
      };

      // Add body for POST requests
      if (method === 'POST') {
        requestOptions.body = body;
      }

      // Send request
      const response = await fetch(urlWithParams.toString(), requestOptions);

      // Parse response
      const contentType = response.headers.get("content-type");
      let responseData;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        responseData = await response.json();
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

  return (
    <div className="api-request-form">
      <div className="request-line">
        <select
          className="method-select"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
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

      <div className="form-sections">
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

        {method === 'POST' && (
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
      </div>

      {response && (
        <div className="section response-section">
          <h3>Response</h3>
          {response.error ? (
            <p className="error">Error: {response.error}</p>
          ) : (
            <>
              <p className="status">Status: {response.status} {response.statusText}</p>
              <div className="response-details">
                <h4>Headers:</h4>
                <pre>{JSON.stringify(response.headers, null, 2)}</pre>
                <h4>Body:</h4>
                <pre>{typeof response.body === 'object' ? JSON.stringify(response.body, null, 2) : response.body}</pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default APIRequestForm;