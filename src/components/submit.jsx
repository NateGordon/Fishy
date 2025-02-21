import React from "react";

const SubmitButton = ({ onClick }) => {
  return (
    <button className="btn submit-button mt-3" onClick={onClick}>
      🎣 Find Fishing Spots
    </button>
  );
};

<div className="submit-container">
  <button className="submit-button">Find Fishing Spots</button>
</div>


export default SubmitButton;

