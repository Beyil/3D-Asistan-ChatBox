import React from "react";



const LeftSidebar = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        height: "100%",
        width: "250px",
        background: "rgba(255, 255, 255, 0.9)",
        boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
        padding: "20px",
        zIndex: 1000,
      }}
    >
      <h3>Sorular</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {questions.map((q, idx) => (
          <li
            key={idx}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()} 
            style={{
              marginBottom: "10px",
              padding: "8px 12px",
              backgroundColor: "#f0f0f0",
              borderRadius: "6px",
              cursor: "pointer",
              outline: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent", 
            }}
          >
            {q}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeftSidebar;
