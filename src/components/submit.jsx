import React from "react";

const SubmitButton = ({ onClick, disabled = false }) => {
  return (
    <button 
      className={`btn submit-button mt-3 ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      🎣 Find Fishing Spots
    </button>
  );
};

export default SubmitButton;

