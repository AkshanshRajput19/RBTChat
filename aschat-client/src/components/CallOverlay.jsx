import { useEffect, useRef, useState } from "react";

const STATUS_TEXT = {
  preparing: "Requesting camera and microphone permission...",
  calling: "Calling...",
  incoming: "Incoming call",
  connecting: "Connecting...",
  connected: "Connected",
  error: "Call could not continue",
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "ar", label: "Arabic" },
];

const TRANSLATION_DICTIONARY = {
  en: {
    hello: "hello",
    hi: "hi",
    "thank you": "thank you",
    thanks: "thanks",
    yes: "yes",
    no: "no",
    "good morning": "good morning",
    "good night": "good night",
    "how are you": "how are you",
    "i am fine": "i am fine",
    "i need help": "i need help",
    "let us meet": "let us meet",
  },
  hi: {
    hello: "नमस्ते",
    hi: "नमस्ते",
    "thank you": "धन्यवाद",
    thanks: "धन्यवाद",
    yes: "हाँ",
    no: "नहीं",
    "good morning": "सुप्रभात",
    "good night": "शुभ रात्रि",
    "how are you": "आप कैसे हैं?",
    "i am fine": "मैं ठीक हूँ",
    "i need help": "मुझे मदद चाहिए",
    "let us meet": "आइए मिलते हैं",
  },
  es: {
    hello: "hola",
    hi: "hola",
    "thank you": "gracias",
    thanks: "gracias",
    yes: "sí",
    no: "no",
    "good morning": "buenos días",
    "good night": "buenas noches",
    "how are you": "¿cómo estás?",
    "i am fine": "estoy bien",
    "i need help": "necesito ayuda",
    "let us meet": "reunámonos",
  },
  fr: {
    hello: "bonjour",
    hi: "salut",
    "thank you": "merci",
    thanks: "merci",
    yes: "oui",
    no: "non",
    "good morning": "bonjour",
    "good night": "bonne nuit",
    "how are you": "comment ça va ?",
    "i am fine": "je vais bien",
    "i need help": "j'ai besoin d'aide",
    "let us meet": "rencontrons-nous",
  },
  ar: {
    hello: "مرحبا",
    hi: "مرحبا",
    "thank you": "شكراً",
    thanks: "شكراً",
    yes: "نعم",
    no: "لا",
    "good morning": "صباح الخير",
    "good night": "تصبح على خير",
    "how are you": "كيف حالك؟",
    "i am fine": "أنا بخير",
    "i need help": "أحتاج إلى مساعدة",
    "let us meet": "لنلتقي",
  },
};

function translateText(text, targetLanguage) {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return "Waiting for speech...";

  const dictionary = TRANSLATION_DICTIONARY[targetLanguage] || TRANSLATION_DICTIONARY.en;
  const directTranslation = dictionary[normalized];
  if (directTranslation) return directTranslation;

  const words = normalized.split(/\s+/);
  const translatedWords = words.map((word) => dictionary[word] || word);
  return translatedWords.join(" ");
}

function getEmotionLabel(text, volumeLevel) {
  const normalized = String(text || "").toLowerCase();

  if (/(happy|great|awesome|love|perfect|excellent|thanks|thank you|glad)/.test(normalized)) {
    return volumeLevel > 0.45 ? "Positive & energetic" : "Positive";
  }

  if (/(sad|bad|problem|issue|worried|angry|frustrated|stress|help|sorry)/.test(normalized)) {
    return "Concerned";
  }

  if (volumeLevel > 0.6) return "Energetic";
  if (volumeLevel < 0.2) return "Calm";
  return "Neutral";
}

function CallOverlay({ call, getInitials }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const volumeRef = useRef(0);

  const [assistantEnabled, setAssistantEnabled] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("Tap Start to begin");
  const [transcript, setTranscript] = useState("No speech detected yet.");
  const [translatedText, setTranslatedText] = useState("Choose a language to translate.");
  const [emotion, setEmotion] = useState("Listening");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [targetLanguage, setTargetLanguage] = useState("hi");
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = call.localStream;
    }
  }, [call.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = call.remoteStream;
    }
  }, [call.remoteStream]);

  useEffect(() => {
    volumeRef.current = volumeLevel;
  }, [volumeLevel]);

  useEffect(() => {
    if (!assistantEnabled || !call.isActive || call.status !== "connected") {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      return undefined;
    }

    if (typeof window === "undefined") return undefined;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAssistantStatus("This browser does not support live transcription.");
      return undefined;
    }

    const startVolumeMeter = () => {
      if (!call.localStream || typeof AudioContext === "undefined") return;

      try {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(call.localStream);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const normalized = average / 255;
          setVolumeLevel(normalized);
          animationFrameRef.current = requestAnimationFrame(tick);
        };

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        tick();
      } catch {
        setAssistantStatus("Microphone analysis could not be started.");
      }
    };

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setAssistantStatus("Listening for speech...");
    };

    recognition.onerror = () => {
      setAssistantStatus("Listening paused. Please try again.");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0].transcript.trim();
        if (result.isFinal) {
          finalTranscript += `${text} `;
        } else {
          interimTranscript += `${text} `;
        }
      }

      if (finalTranscript.trim()) {
        const nextText = finalTranscript.trim();
        setTranscript(nextText);
        setTranslatedText(translateText(nextText, targetLanguage));
        setEmotion(getEmotionLabel(nextText, volumeRef.current));
        setAssistantStatus("Live transcript ready");
      } else if (interimTranscript.trim()) {
        const nextText = interimTranscript.trim();
        setTranscript(nextText);
        setTranslatedText(translateText(nextText, targetLanguage));
        setEmotion(getEmotionLabel(nextText, volumeRef.current));
      }
    };

    recognition.onend = () => {
      if (assistantEnabled && call.isActive && call.status === "connected") {
        recognition.start();
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      startVolumeMeter();
    } catch {
      setAssistantStatus("Live assistant could not start. Please refresh and try again.");
    }

    return () => {
      recognition.stop();
      recognitionRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [assistantEnabled, call.isActive, call.localStream, call.status, targetLanguage]);

  if (!call.isActive) return null;

  return (
    <div className="call-overlay">
      <div className={`call-dialog ${call.type}`}>
        <div className="call-media">
          <video
            ref={remoteVideoRef}
            className={
              call.type === "video"
                ? "remote-call-video"
                : "hidden-call-media"
            }
            autoPlay
            playsInline
          />

          {(call.type === "voice" || !call.remoteStream) && (
            <div className="call-avatar">
              {getInitials(call.partner?.name)}
            </div>
          )}

          {call.type === "video" && call.localStream && (
            <video
              ref={localVideoRef}
              className="local-call-video"
              autoPlay
              playsInline
              muted
            />
          )}
        </div>

        <div className="call-information">
          <span>{call.type === "video" ? "Video call" : "Voice call"}</span>
          <h2>{call.partner?.name || "RBTChat user"}</h2>
          <p>{STATUS_TEXT[call.status]}</p>
          {call.error && <div className="call-error">{call.error}</div>}
        </div>

        {call.status === "connected" && (
          <div className="call-ai-assistant">
            <div className="call-ai-header">
              <div>
                <strong>RBT-AI Live Assistant</strong>
                <p>Live transcription, translation, and tone help during calls.</p>
              </div>
              <button
                type="button"
                className={`call-ai-toggle ${assistantEnabled ? "active" : ""}`}
                onClick={() => {
                  setAssistantEnabled((value) => !value);
                  setShowGuide(false);
                }}
              >
                {assistantEnabled ? "Stop" : "Start"}
              </button>
            </div>

            {showGuide && !assistantEnabled && (
              <div className="call-ai-guide">
                <ul>
                  <li>Allow microphone access when prompted.</li>
                  <li>Press Start and speak naturally.</li>
                  <li>Choose a language to translate the conversation.</li>
                </ul>
              </div>
            )}

            {assistantEnabled && (
              <>
                <label className="call-ai-language">
                  <span>Translate to</span>
                  <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="call-ai-card">
                  <div className="call-ai-card-title">Live transcript</div>
                  <p>{transcript}</p>
                </div>

                <div className="call-ai-card">
                  <div className="call-ai-card-title">Translation</div>
                  <p>{translatedText}</p>
                </div>

                <div className="call-ai-meta">
                  <span>Emotion: {emotion}</span>
                  <span>Volume: {Math.round(volumeLevel * 100)}%</span>
                </div>
              </>
            )}

            <div className="call-ai-status">{assistantStatus}</div>
          </div>
        )}

        {call.status === "incoming" ? (
          <div className="incoming-call-actions">
            <button className="reject-call" onClick={call.rejectCall}>
              Reject
            </button>
            <button className="accept-call" onClick={call.acceptCall}>
              Accept
            </button>
          </div>
        ) : call.status === "error" ? (
          <div className="incoming-call-actions">
            <button className="reject-call" onClick={call.closeError}>
              Close
            </button>
          </div>
        ) : (
          <div className="active-call-actions">
            <button
              className={call.isMuted ? "control-active" : ""}
              onClick={call.toggleMute}
            >
              {call.isMuted ? "Unmute" : "Mute"}
            </button>

            {call.type === "video" && (
              <>
                <button
                  className={call.isCameraOff ? "control-active" : ""}
                  onClick={call.toggleCamera}
                >
                  {call.isCameraOff ? "Camera on" : "Camera off"}
                </button>

                <button
                  className={call.isScreenSharing ? "control-active" : ""}
                  onClick={call.toggleScreenShare}
                >
                  {call.isScreenSharing ? "Stop sharing" : "Share screen"}
                </button>
              </>
            )}

            <button className="reject-call" onClick={call.endCall}>
              End
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallOverlay;
