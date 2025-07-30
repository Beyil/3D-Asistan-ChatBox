import React, { useState } from "react";

// Kullanıcıdan metin girişi alan ve soru gönderen bileşen
const ChatBox = ({ onAsk }) => {
  const [input, setInput] = useState("");

  // Form gönderildiğinde çalışır
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    onAsk(input);
    setInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: "absolute",
        bottom: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        background: "rgba(255, 255, 255, 0.3)",
        backdropFilter: "blur(10px)",
        borderRadius: "20px",
        padding: "8px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      {/* Kullanıcıdan metin alınan input kutusu */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Sorunuzu sorabilirsiniz"
        style={{
          border: "none",
          outline: "none",
          color: "#000",
          padding: "10px 14px",
          fontSize: "16px",
          width: "300px",
          borderRadius: "20px",
        }}
      />

      {/* Soruyu gönder butonu */}
      <button
        type="submit"
        style={{
          backgroundColor: "#2e2e2eff",
          border: "none",
          borderRadius: "18px",
          padding: "10px 16px",
          marginLeft: "8px",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Sor
      </button>
    </form>
  );
};

export default ChatBox;
