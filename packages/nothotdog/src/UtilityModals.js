// Modals.js
import React from 'react';
import ModalComponent from './Components/ModalComponent';

export const SaveTestModal = ({ showModal, setShowModal, description, setDescription, groupOptions, setSelectedGroupId, selectedGroupId, saveTest, updateTest, isUpdate }) => (
  <ModalComponent
    showModal={showModal}
    onClose={() => setShowModal(false)}
    headerContent={isUpdate ? 'Update Test' : 'Save Test'}  // Update header based on action
  >
    <label htmlFor="description">Description:</label>
    <input
      className='file-input'
      type="text"
      id="description"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="Enter description"
    />
    
    <label htmlFor="group">Select Group:</label>
    <select
      id="group"
      value={selectedGroupId}
      onChange={(e) => setSelectedGroupId(e.target.value)}
    >
      <option value="">Select a group</option>
      {groupOptions.map((group) => (
        <option key={group.id} value={group.id}>
          {group.name}
        </option>
      ))}
    </select>
    
    <div className="button-group">
      <button 
        className="button primary" 
        onClick={isUpdate ? updateTest : saveTest}  // Call updateTest or saveTest based on isUpdate
      >
        {isUpdate ? 'Update' : 'Save'}
      </button>
      <button 
        className="button" 
        onClick={() => setShowModal(false)}
      >
        Cancel
      </button>
    </div>
  </ModalComponent>
);

export const SignInModal = ({ showSignInModal, setShowSignInModal, signIn }) => {
  return (
    showSignInModal && (
      <div className="signin-modal">
        <div className="signin-modal-content">
          <span className="signin-modal-close" onClick={() => setShowSignInModal(false)}>&times;</span>
          <p>Please login using your Google Account to use these features.</p>
          <button className="signin-modal-button primary" onClick={signIn}>SIGN IN</button>
        </div>
      </div>
    )
  );
};
