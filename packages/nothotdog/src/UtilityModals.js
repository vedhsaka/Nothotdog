// Modals.js
import React from 'react';
import ModalComponent from './Components/ModalComponent';

export const SaveTestModal = ({ showModal, setShowModal, description, setDescription, groupOptions, setSelectedGroupId, selectedGroupId, saveTest }) => (
  <ModalComponent
    showModal={showModal}
    onClose={() => setShowModal(false)}
    headerContent={'Save Test'}
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
      <button className="button primary" onClick={saveTest}>Save</button>
      <button className="button" onClick={() => setShowModal(false)}>Cancel</button>
    </div>
  </ModalComponent>
);

export const SignInModal = ({ showSignInModal, setShowSignInModal, signIn }) => (
  <ModalComponent
    showModal={showSignInModal}
    onClose={() => setShowSignInModal(false)}
    headerContent={'Sign In Required'}
  >
    <p>You need to sign in to save tests.</p>
    <button className="button primary" onClick={signIn}>Sign In</button>
  </ModalComponent>
);
