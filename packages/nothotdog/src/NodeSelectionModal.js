import React, { useState } from 'react';

const NodeSelectionModal = ({ showModal, setShowModal, jsonResponse, setSelectedNodePath, setSelectedNodeValue }) => {
  const [currentPath, setCurrentPath] = useState('');

  const handleNodeSelect = (path, value) => {
    setSelectedNodePath(path);
    setSelectedNodeValue(value);
    setShowModal(false);
  };

  const renderJsonTree = (obj, path = '') => {
    return (
      <ul>
        {Object.keys(obj).map((key) => {
          const value = obj[key];
          const newPath = path ? `${path}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            return (
              <li key={newPath}>
                <span>{key}</span>
                {renderJsonTree(value, newPath)}
              </li>
            );
          } else {
            return (
              <li key={newPath} onClick={() => handleNodeSelect(newPath, value)}>
                <span>{key}: {String(value)}</span>
              </li>
            );
          }
        })}
      </ul>
    );
  };

  return (
    showModal && (
      <div className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => setShowModal(false)}>&times;</span>
          <h2>Select a Node</h2>
          <div className="json-tree">
            {renderJsonTree(jsonResponse)}
          </div>
        </div>
      </div>
    )
  );
};

export default NodeSelectionModal;
