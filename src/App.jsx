import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { speakWithVisemes } from "./components/SpeechSynth";
import { Model } from "./components/Avatar";
import ChatBox from "./components/ChatBox";

function App() {
  // Konuşma sırasında kullanılan viseme kuyruğu
  const visemeQueue = useRef([]);
  const speechStartTime = useRef(null);

  // Soru-cevap listesini saklayan state
  const [qaList, setQaList] = useState([]);

  // Model referansı ve kontrol elemanları
  const modelRef = useRef();
  const controlsRef = useRef();
  const cameraRef = useRef();

  // Sidebar kontrolü
  const [showSidebar, setShowSidebar] = useState(false);

  // Model ve ses değişimi için state
  const [currentModelUrl, setCurrentModelUrl] = useState("/model.glb");
  const [voiceName, setVoiceName] = useState("tr-TR-AhmetNeural");

  // Uygulama ilk yüklendiğinde JSON dosyasından soru-cevap verilerini çek
  useEffect(() => {
    fetch("/assets/qa.json")
      .then((res) => res.json())
      .then((data) => setQaList(data))
      .catch((err) => console.error("qa.json yüklenemedi:", err));
  }, []);

  // Kullanıcıdan gelen metni normalize eden yardımcı fonksiyon
  const normalize = (text) =>
    text.toLowerCase().trim().replace(/[^\wşçöüğıi]/gi, "");

  // Kullanıcı bir soru sorduğunda çalışan fonksiyon
  const handleAsk = (question) => {
    const normalizedInput = normalize(question);
    const found = qaList.find((pair) => normalize(pair.q) === normalizedInput);

    const answer = found?.a || "Bu soruya verecek bir cevabım yok.";
    const anim = found?.anim || "Idle";

    // Animasyon değiştirme
    if (modelRef.current?.currentAnimation !== anim) {
      modelRef.current?.playAnimation(anim);
      modelRef.current.currentAnimation = anim;
    }

    // Konuşma başlatma ve viseme kuyruğunu hazırlama
    visemeQueue.current = [];
    speechStartTime.current = Date.now();

    speakWithVisemes(
      answer,
      (visemeId, offset) => {
        visemeQueue.current.push({ id: visemeId, offset });
      },
      () => {
        visemeQueue.current.push(null);
      },
      voiceName
    );
  };

  // Kamera sıfırlama fonksiyonu
  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    if (cameraRef.current) {
      cameraRef.current.position.z = 3;
    }
  };

  // Kamera yakınlaştır
  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(1, cameraRef.current.position.z - 0.5);
    }
  };

  // Kamera uzaklaştır
  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.min(10, cameraRef.current.position.z + 0.5);
    }
  };

  // Avatar modelini ve sesini değiştir
  const toggleModel = () => {
    setCurrentModelUrl((prev) => {
      const next = prev === "/model.glb" ? "/female.glb" : "/model.glb";
      setVoiceName(next === "/female.glb" ? "tr-TR-EmelNeural" : "tr-TR-AhmetNeural");
      return next;
    });
  };

  // Soru listesi 
  const questionsList = [
    "Merhaba.",
    "Bana kendini tanıtır mısın?",
    "Sana neler sorabilirim?",
    "Hobilerin neler?",
    "Seni vurdum!",
    "Dans edebilir misin?",
    "Bana bir espiri yapar mısın?",
    "İlk espirin çok güzeldi başka var mı?",
    "Beni KoçSistem hakkında kısaca bilgilendirir misin?",
    "Termodinamik nedir? Kısaca anlatır mısın?",
    "Şarkı söyler misin?",
  ];

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
        backgroundImage: "url('/assets/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Sidebar butonu */}
      <button
        onClick={() => setShowSidebar((prev) => !prev)}
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          zIndex: 20,
          padding: "10px 15px",
          borderRadius: "8px",
          backgroundColor: "#222",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        {showSidebar ? "Kapat" : "Sorular"}
      </button>

      {/* Soru listesi sidebar */}
      {showSidebar && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "250px",
            height: "100vh",
            background: "rgba(255,255,255,0.95)",
            zIndex: 15,
            padding: "40px 20px 20px 20px",
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Soru Listesi</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {questionsList.map((question, idx) => (
              <li
                key={idx}
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAsk(question)}
                style={{
                  marginBottom: "12px",
                  padding: "10px",
                  borderRadius: "6px",
                  backgroundColor: "#eee",
                  cursor: "pointer",
                  outline: "none",
                  userSelect: "none",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {question}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3D Canvas=KAMERA */}
      <Canvas
        camera={{ position: [0, 0, 3], fov: 40 }}
        onCreated={({ camera }) => {
          cameraRef.current = camera;
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[0, 10, 10]} intensity={1} castShadow />
        <Model
          key={currentModelUrl}
          ref={modelRef}
          visemeQueue={visemeQueue}
          speechStartTime={speechStartTime}
          modelUrl={currentModelUrl}
        />
        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
        />
      </Canvas>

      {/* Yakınlaştır/Uzaklaştır butonları */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "20px",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 10,
        }}
      >
        <button onClick={handleZoomIn} style={zoomButtonStyle}>+</button>
        <button onClick={handleZoomOut} style={zoomButtonStyle}>-</button>
      </div>

      {/* Kamera sıfırlama butonu */}
      <button
        onClick={resetCamera}
        style={{
          position: "absolute",
          right: "20px",
          bottom: "20px",
          padding: "10px 15px",
          borderRadius: "8px",
          backgroundColor: "#333",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        Kamerayı Sıfırla
      </button>

      {/* Model değiştirme butonu */}
      <button
        onClick={toggleModel}
        style={{
          position: "absolute",
          right: "160px",
          bottom: "20px",
          padding: "10px 15px",
          borderRadius: "8px",
          backgroundColor: "#2e2e2eff",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        Model Değiştir
      </button>

      {/* Chat kutusu */}
      <ChatBox onAsk={handleAsk} />
    </div>
  );
}

// Zoom butonları için stil
const zoomButtonStyle = {
  padding: "10px 15px",
  fontSize: "18px",
  borderRadius: "8px",
  backgroundColor: "#2e2e2eff",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};

export default App;
