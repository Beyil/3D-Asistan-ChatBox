
import * as speechSDK from "microsoft-cognitiveservices-speech-sdk";

// bir önceki sesi durdurabilmek için tutulur
let currentSynthesizer = null;
let currentPlayer = null;

/**
 * Metni sese çevirip viseme (dudak hareketi) verilerini ileten fonksiyon.
 *
 * @param {string} text - Konuşulacak metin
 * @param {function} onViseme - Her viseme verisi alındığında çağrılır
 * @param {function} onEnd - Konuşma bittiğinde çağrılır
 * @param {string} voiceName - Kullanılacak sesin adı 
 */
export function speakWithVisemes(text, onViseme, onEnd, voiceName = "tr-TR-AhmetNeural") {
  // Daha önce konuşan synthesizer varsa kapat
  if (currentSynthesizer) {
    currentSynthesizer.close();
    currentSynthesizer = null;
  }
  if (currentPlayer && typeof currentPlayer.pause === "function") {
    currentPlayer.pause();
  }

  //  Azure Services yapılandırması
  const speechConfig = speechSDK.SpeechConfig.fromSubscription(
    "key",
    "westeurope"
  );

  speechConfig.speechSynthesisVoiceName = voiceName;

  //  Viseme verisini almak için bu özellik aktif edilir
  speechConfig.setProperty(
    speechSDK.PropertyId.SpeechServiceResponse_RequestViseme,
    "true"
  );

  // Ses çıktısı hedefi 
  const player = new speechSDK.SpeakerAudioDestination();

  // Synthesizer (konuşma motoru) oluştrulur
  const synthesizer = new speechSDK.SpeechSynthesizer(speechConfig, player);
  currentSynthesizer = synthesizer;
  currentPlayer = player;

  //  Viseme verisi geldiğinde tetiklenir
  synthesizer.visemeReceived = function (s, e) {
    const visemeId = e.visemeId;
    const offset = e.audioOffset / 10000; // 100-nano saniye 
    onViseme?.(visemeId, offset);
  };

  //Konuşma tamamlandığında tetiklenir
  synthesizer.synthesisCompleted = function () {
    onEnd?.();
    synthesizer.close();
    currentSynthesizer = null;
  };

  //Konuşma iptal edilirse tetiklenir
  synthesizer.synthesisCanceled = function (s, e) {
    onEnd?.();
    synthesizer.close();
    currentSynthesizer = null;
  };

  // Konuşmayı başlat
  synthesizer.speakTextAsync(text);
}
