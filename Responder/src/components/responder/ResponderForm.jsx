import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { saveReport, initDB, getUnsyncedReports, deleteReport, clearAllReports } from "../../utils/indexedDB";
import MapDisplay from "../MapDisplay";
// 1. Import Storage references
import { db, storage, auth } from "../../firebase"; 
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";

function ResponderForm() {
  const [formData, setFormData] = useState({
    incidentType: "",
    severity: "3",
    description: "",
    photo: null,
    latitude: null,
    longitude: null,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    initDB();
    console.log(auth.currentUser);
    if (!auth.currentUser) {
      signInAnonymously(auth)
        .catch((error) => {});
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (error) => console.log("Location error")
      );
    }
    
    if (navigator.onLine) {
       setTimeout(() => syncDataToAPI(), 1000);
    }

    initializeSpeechRecognition();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => { 
        setIsOnline(true); 
        syncDataToAPI(); 
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = voiceLanguage;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => console.log('Voice recognition started');

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setInterimText(interimTranscript);
      
      if (finalTranscript) {
        processVoiceCommand(finalTranscript.trim());
        setTranscript(finalTranscript.trim());
        setTimeout(() => setTranscript(''), 2000);
      } else {
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'audio-capture') {
        alert('Microphone not accessible. Please check permissions.');
        setIsListening(false);
      } else if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please grant permissions.');
        setIsListening(false);
      } else {
        setTimeout(() => {
          if (isListening && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          try { recognitionRef.current?.start(); } catch (e) { setIsListening(false); }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
  };

  const processVoiceCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    let commandProcessed = false;

    if (lowerCommand.match(/landslide|භූමිෂ්ථර|நிலச்சரிவு/i)) {
      setFormData(prev => ({ ...prev, incidentType: 'Landslide' }));
      commandProcessed = true;
    } else if (lowerCommand.match(/flood|ගංවතුර|வெள்ளம்/i)) {
      setFormData(prev => ({ ...prev, incidentType: 'Flood' }));
      commandProcessed = true;
    } else if (lowerCommand.match(/road block|roadblock|මාර්ග අවහිරතා|சாலை தடை/i)) {
      setFormData(prev => ({ ...prev, incidentType: 'Road Block' }));
      commandProcessed = true;
    } else if (lowerCommand.match(/power line|powerline|විදුලි රැහැන්|மின்சார கம்பி/i)) {
      setFormData(prev => ({ ...prev, incidentType: 'Power Line Down' }));
      commandProcessed = true;
    }

    if (lowerCommand.match(/critical|තීව්‍ර|முக்கியமான|severity 5|level 5/i)) {
      setFormData(prev => ({ ...prev, severity: '5' }));
      commandProcessed = true;
    } else if (lowerCommand.match(/high|ඉහළ|உயர்|severity 4|level 4/i)) {
      setFormData(prev => ({ ...prev, severity: '4' }));
      commandProcessed = true;
    } else if (lowerCommand.match(/medium|මධ්‍යම|நடுத்தர|severity 3|level 3/i)) {
      setFormData(prev => ({ ...prev, severity: '3' }));
      commandProcessed = true;
    } else if (lowerCommand.match(/low|අඩු|குறைந்த|severity 2|level 2/i)) {
      setFormData(prev => ({ ...prev, severity: '2' }));
      commandProcessed = true;
    } else if (lowerCommand.match(/minimal|අවම|குறைந்தபட்ச|severity 1|level 1/i)) {
      setFormData(prev => ({ ...prev, severity: '1' }));
      commandProcessed = true;
    }

    if (!lowerCommand.match(/submit|save|ඉදිරිපත්|சமர்ப்பிக்க/i) && !commandProcessed) {
      setFormData(prev => ({ 
        ...prev, 
        description: prev.description ? `${prev.description} ${command}` : command 
      }));
    }

    if (lowerCommand.match(/submit report|save report|වාර්තාව ඉදිරිපත්|அறிக்கை சமர்ப்பிக்க/i)) {
      setTimeout(() => document.querySelector('form')?.requestSubmit(), 500);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) { alert('Voice recognition not supported'); return; }

    if (isListening) {
      recognitionRef.current.stop();
      clearTimeout(restartTimeoutRef.current);
      setIsListening(false);
      setTranscript('');
      setInterimText('');
    } else {
      try {
        recognitionRef.current.lang = voiceLanguage;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        alert('Could not start voice recognition.');
      }
    }
  };

  useEffect(() => {
    if (recognitionRef.current && !isListening) recognitionRef.current.lang = voiceLanguage;
  }, [voiceLanguage, isListening]);

  const syncDataToAPI = async () => {
    if (isSyncing) return;
    
    try {
      const unsyncedReports = await getUnsyncedReports();
      if (unsyncedReports.length === 0) return;

      setIsSyncing(true);
      let syncedCount = 0;

      for (const report of unsyncedReports) {
        try {
          let photoURL = null;
          if (report.photo) {
            const imageRef = ref(storage, `reports/${report.id}_${Date.now()}.jpg`);
            await uploadString(imageRef, report.photo, 'data_url');
            photoURL = await getDownloadURL(imageRef);
          }

          const reportsCollection = collection(db, "responderReports");
          const reportData = {
            incidentType: report.incidentType || "",
            severity: report.severity || "3",
            timestamp: report.timestamp,
            photo: photoURL,
            createdAt: new Date(report.createdAt),
            syncedAt: new Date(),
            responderID: auth.currentUser ? auth.currentUser.uid : "anonymous",
          };
          if (report.latitude !== undefined && report.latitude !== null) reportData.latitude = report.latitude;
          if (report.longitude !== undefined && report.longitude !== null) reportData.longitude = report.longitude;
          if (report.description) reportData.description = report.description;

          await addDoc(reportsCollection, reportData);
          await deleteReport(report.id);
          syncedCount++;
        } catch {}
      }

      if (syncedCount > 0) alert(`✅ ${syncedCount} report(s) synced to server!`);
      
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearDB = async () => {
    if (!window.confirm("Are you sure you want to delete ALL reports from local storage?")) return;
    setIsClearing(true);
    try {
      await clearAllReports();
      alert("✅ All local reports cleared!");
      setFormData({ incidentType: "", severity: "3", description: "", photo: null, latitude: null, longitude: null });
    } catch (err) {
      alert("❌ Error clearing database: " + err.message);
    } finally {
      setIsClearing(false);
    }
  };

  const handleChange = e => { 
    const { name, value, files } = e.target; 
    if (name === "photo") setFormData({ ...formData, photo: files[0] }); 
    else setFormData({ ...formData, [name]: value }); 
  };
  
  const handleSubmit = e => {
    e.preventDefault();
    
    if (!formData.incidentType) { alert("Please select an incident type"); return; }
    
    const readImageAsBase64 = () => {
      return new Promise((resolve) => {
        if (!formData.photo) resolve(null);
        else {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(formData.photo);
        }
      });
    };

    readImageAsBase64().then(imageBase64 => {
      const newReport = { 
        id: Date.now(),
        incidentType: formData.incidentType, 
        severity: formData.severity,
        description: formData.description,
        timestamp: new Date().toLocaleString(),
        createdAt: Date.now(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        photo: imageBase64
      };

      saveReport(newReport)
        .then(() => {
          alert(isOnline ? "✅ Report saved! Syncing to server..." : "✅ Report saved locally! Will sync when online.");
          setFormData({ incidentType: "", severity: "3", description: "", photo: null, latitude: formData.latitude, longitude: formData.longitude });
          if (isOnline) syncDataToAPI();
        })
        .catch(err => alert("❌ Failed to save report: " + err.message));
    });
  };

  return (
    <div style={styles.screen}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{...styles.statusSymbol, backgroundColor: isOnline ? "#16a34a" : "#991b1b"}} title={isOnline ? "Online" : "Offline"}></div>

          <div style={styles.headerContent}>
            <div style={styles.icon}>🚨</div>
            <h1 style={styles.title}>Incident Report</h1>
            <p style={styles.subtitle}>Field responder submission</p>
            
            <div style={styles.voiceControls}>
              <select 
                value={voiceLanguage} 
                onChange={(e) => setVoiceLanguage(e.target.value)}
                style={styles.languageSelect}
                disabled={isListening}
              >
                <option value="en-US">🇬🇧 English</option>
                <option value="si-LK">🇱🇰 සිංහල (Sinhala)</option>
                <option value="ta-LK">🇱🇰 தமிழ் (Tamil)</option>
              </select>
              
              <button 
                type="button"
                onClick={toggleVoiceInput}
                style={{
                  ...styles.voiceButton,
                  background: isListening ? '#dc2626' : '#8B2E2E',
                  animation: isListening ? 'pulse 1.5s infinite' : 'none'
                }}
              >
                {isListening ? '🎙️ Listening...' : '🎙️ Voice Input'}
              </button>
            </div>
            
            {isListening && (
              <div style={styles.voiceIndicator}>
                <p style={styles.voiceTranscript}>
                  {interimText ? <span style={{opacity: 0.6}}>{interimText}</span> : transcript || 'Speak now...'}
                </p>
                <p style={styles.voiceHint}>
                  Say: "Landslide", "Critical severity", "Submit report"
                </p>
                <p style={styles.voiceStatus}>🎤 Microphone active - Continuous listening</p>
              </div>
            )}
          </div>

          {isSyncing && <p style={styles.syncText}>Syncing…</p>}
          {formData.latitude && formData.longitude && (
            <MapDisplay latitude={formData.latitude} longitude={formData.longitude} incidentType={formData.incidentType || "Incident"} />
          )}

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Incident Type</label>
              <select name="incidentType" value={formData.incidentType} onChange={handleChange} required style={styles.input}>
                <option value="">Select incident</option>
                <option value="Landslide">Landslide</option>
                <option value="Flood">Flood</option>
                <option value="Road Block">Road Block</option>
                <option value="Power Line Down">Power Line Down</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Severity Level</label>
              <div style={styles.severityGrid}>
                {["1","2","3","4","5"].map(level => {
                  let bgColor = "#fff";
                  let color = "#8B2E2E";
                  if (formData.severity === level) {
                    switch(level) {
                      case "1": bgColor = "green"; color = "#fff"; break;
                      case "2": bgColor = "lightgreen"; color = "#000"; break;
                      case "3": bgColor = "yellow"; color = "#000"; break;
                      case "4": bgColor = "orange"; color = "#fff"; break;
                      case "5": bgColor = "red"; color = "#fff"; break;
                    }
                  }
                  return (
                    <label key={level} style={{ ...styles.severityBox, backgroundColor: bgColor, color: color }}>
                      <input type="radio" name="severity" value={level} checked={formData.severity === level} onChange={handleChange} style={{ display: "none" }} />
                      {level}
                    </label>
                  )
                })}
              </div>
              <p style={styles.severityIndicator}>1 = Low Severity | 5 = High Severity</p>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Description (optional)</label>
              <textarea rows={4} placeholder="Hazards, landmarks, notes…" name="description" value={formData.description} onChange={handleChange} style={styles.textarea} />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Photo (optional)</label>
              <div style={styles.photoInputContainer}>
                <input type="file" name="photo" accept="image/*" onChange={handleChange} style={styles.photoInput} />
                {formData.photo ? (
                  <img src={URL.createObjectURL(formData.photo)} alt="preview" style={styles.imagePreviewInside} />
                ) : (
                  <span style={styles.photoPlaceholder}>Choose photo</span>
                )}
              </div>
            </div>

            <button type="submit" style={styles.button}>Save Report</button>
          </form>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => navigate("/pending-reports")}
              style={{ ...styles.button, flex: 1, background: "#8B2E2E", fontSize: "0.85rem" }}
            >Pending Reports
            </button>

            <button
              type="button"
              onClick={() => navigate("/past-reports")}
              style={{ ...styles.button, flex: 1, background: "#8B2E2E", fontSize: "0.85rem"  }}
            >Past Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    minHeight: "100svh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
    background: "linear-gradient(135deg, #8B2E2E, #3a0d0d)",
    fontFamily: "'Roboto', sans-serif",
  },
  container: { width: "100%", maxWidth: "500px" },
  card: {
    position: "relative",
    background: "#fff",
    borderRadius: "20px",
    padding: "2rem",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 10px #00000080 inset",
    border: "1px solid rgba(0,0,0,0.1)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  statusSymbol: {
    position: "absolute",
    top: "15px",
    right: "15px",
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    boxShadow: "0 0 8px #000",
  },
  headerContent: { textAlign: "center", marginBottom: "2rem" },
  icon: { fontSize: "3rem", marginBottom: "0.5rem", textShadow: "0 0 6px #000" },
  title: { fontSize: "2rem", fontWeight: "700", color: "#8B2E2E" },
  subtitle: { fontSize: "0.9rem", color: "#333", opacity: 0.8 },
  voiceControls: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "1rem",
    alignItems: "center",
  },
  languageSelect: {
    flex: 1,
    padding: "0.75rem",
    borderRadius: "10px",
    border: "2px solid #8B2E2E",
    fontSize: "0.85rem",
    cursor: "pointer",
    fontWeight: "600",
  },
  voiceButton: {
    flex: 1,
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "none",
    background: "#8B2E2E",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "0.85rem",
    transition: "all 0.3s ease",
  },
  voiceIndicator: {
    background: "#f0f0f0",
    borderRadius: "12px",
    padding: "1rem",
    marginTop: "1rem",
    border: "2px solid #8B2E2E",
  },
  voiceTranscript: {
    fontSize: "0.95rem",
    fontStyle: "italic",
    color: "#333",
    marginBottom: "0.5rem",
  },
  voiceHint: {
    fontSize: "0.8rem",
    color: "#666",
    marginBottom: "0.5rem",
  },
  voiceStatus: {
    fontSize: "0.8rem",
    color: "#16a34a",
    fontWeight: "600",
  },
  syncText: { fontSize: "0.8rem", color: "#555", fontStyle: "italic", textAlign: "center", marginBottom: "1rem" },
  form: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#8B2E2E" },
  input: {
    height: "50px",
    padding: "0 1rem",
    borderRadius: "12px",
    border: "2px solid #8B2E2E",
    background: "#fff",
    color: "#333",
    fontSize: "1rem",
    outline: "none",
    boxShadow: "0 0 5px #00000050 inset",
    transition: "0.3s",
  },
  textarea: {
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    border: "2px solid #8B2E2E",
    background: "#fff",
    color: "#333",
    fontSize: "1rem",
    resize: "none",
    boxShadow: "0 0 5px #00000050 inset",
  },
  severityGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" },
  severityBox: {
    padding: "0.8rem 0",
    borderRadius: "12px",
    border: "2px solid #8B2E2E",
    textAlign: "center",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: "#8B2E2E",
    transition: "all 0.3s ease",
    background: "#fff",
  },
  severityIndicator: {
    fontSize: "0.75rem",
    color: "#8B2E2E",
    textAlign: "center",
    marginTop: "0.25rem",
    fontStyle: "italic",
  },
  button: {
    height: "52px",
    borderRadius: "15px",
    border: "none",
    background: "#8B2E2E",
    color: "#fff",
    fontWeight: "700",
    fontSize: "1rem",
    cursor: "pointer",
    boxShadow: "0 0 15px #00000080",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  photoInputContainer: {
    position: "relative",
    borderRadius: "12px",
    border: "2px dashed #8B2E2E",
    height: "180px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    cursor: "pointer",
    background: "#fff",
    transition: "0.3s",
  },
  photoInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },
  photoPlaceholder: {
    color: "#8B2E2E",
    fontWeight: "600",
  },
  imagePreviewInside: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "12px",
  }
};

export default ResponderForm;
