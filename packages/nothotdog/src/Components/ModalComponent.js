import React from 'react';
import '../styles/Modal.css'

const ModalComponent = ({ showModal, onClose, headerContent, children }) => {
  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className='modal-header'>
        <h2>{headerContent}</h2> 
        </div>
        <hr/>
        <div className="modal-body" >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalComponent;
