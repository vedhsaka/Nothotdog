import React, { useState, useEffect, useRef } from 'react';
import './css/HeaderDropdown.css';
import flameIcon from './icons/flame.svg'; // Make sure this path is correct

const HeaderDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('Voice');
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div>
    <div className="header-container">
      <div className="flame-header">
        <img src={flameIcon} alt="Flame" className="flame-icon" />
        <h1>Flame</h1>
      </div>
      </div>

      <div className="header-dropdown" ref={dropdownRef}>
        <button onClick={toggleDropdown} className="dropdown-toggle">
          {selected} <span className="arrow">▼</span>
        </button>
        <ul className={`dropdown-menu ${isOpen ? 'open' : ''}`}>
          <li onClick={() => handleSelect('Voice')}>Voice</li>
          <li className="disabled">Text</li>
          <li className="disabled">Video</li>
        </ul>
      </div>
    </div>
  );
};

export default HeaderDropdown;