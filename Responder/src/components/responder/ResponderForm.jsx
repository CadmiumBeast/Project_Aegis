import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { saveReport, initDB, getUnsyncedReports, markAsSynced, clearAllReports } from "../../utils/indexedDB";
import MapDisplay from "../MapDisplay";
import { translations } from "../../utils/translations";
// 1. Import Storage references
import { db, storage, auth } from "../../firebase"; 
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

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
  const [uiLanguage, setUiLanguage] = useState(() => {
    // Load saved language preference or default to 'en'
    return localStorage.getItem('aegis_ui_language') || 'en';
  });
  const [voiceLanguage, setVoiceLanguage] = useState(() => {
    // Load saved voice language preference or default to 'en-US'
    return localStorage.getItem('aegis_voice_language') || 'en-US';
  });
  const [interimText, setInterimText] = useState('');
  const [notification, setNotification] = useState(null);
  const [lastNotificationMessage, setLastNotificationMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const notificationTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Save language preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('aegis_ui_language', uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    localStorage.setItem('aegis_voice_language', voiceLanguage);
  }, [voiceLanguage]);

  // Get translations for current UI language
  const t = translations[uiLanguage] || translations.en;

  // Notification system - prevents duplicates and auto-dismisses
  const showNotification = (message, type = 'success') => {
    // Prevent duplicate notifications
    if (message === lastNotificationMessage) {
      return;
    }
    
    setLastNotificationMessage(message);
    setNotification({ message, type });
    
    // Clear previous timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    // Auto-dismiss after 4 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      setLastNotificationMessage('');
    }, 4000);
  };

  useEffect(() => {
    initDB();
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        console.log('👤 Logged in as:', user.displayName || user.email);
        
        // Ensure user profile exists in Firestore
        ensureUserProfile(user);
      } else {
        console.log('⚠️ No user logged in - responder must be authenticated');
        showNotification('Please log in to submit reports', 'warning');
        setCurrentUser(null);
      }
    });
    
    const ensureUserProfile = async (user) => {
      try {
        const { doc, getDoc, setDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          console.log('⚠️ User profile not found, creating one...');
          const newProfile = {
            uid: user.uid,
            name: user.displayName || user.email || 'Responder',
            email: user.email || 'No email',
            phone: 'Not provided',
            number: 'Not provided',
            role: 'responder',
            createdAt: new Date(),
            lastLogin: new Date()
          };
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
          console.log('✅ User profile created');
        } else {
          const profileData = userSnap.data();
          setUserProfile(profileData);
          console.log('✅ User profile exists:', profileData);
        }
      } catch (error) {
        console.error('Error ensuring user profile:', error);
      }
    };
    
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
      unsubscribe();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
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
    recognition.maxAlternatives = 5; // Get more interpretations for better accuracy

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
        showNotification('Microphone not accessible. Please check permissions.', 'error');
        setIsListening(false);
      } else if (event.error === 'not-allowed') {
        showNotification('Microphone access denied. Please grant permissions.', 'error');
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
    console.log('🎤 Processing command:', command);
    console.log('🔍 Lowercase version:', lowerCommand);

    let commandProcessed = false;
    let updateMessage = '';

    // ENHANCED Multilingual Incident Type Detection with flexible spacing
    // English + Sinhala + Tamil with natural variations and spacing flexibility
    if (lowerCommand.match(/landslide|land\s*slide|mud\s*slide|mudslide|mountain\s*fall|hill\s*collapse|පස්\s*කන්ද|භූමි\s*ඇද\s*වැටීම|කන්ද\s*කඩා\s*වැටීම|மலை\s*சரிவு|நிலச்\s*சரிவு|நிலச்சரிவு|மண்\s*சரிவு/i)) {
      setFormData(prev => ({ ...prev, incidentType: 'Landslide' }));
      updateMessage = '✅ Landslide selected';
      commandProcessed = true;
      console.log('✅ MATCHED: Landslide');
    } else if (lowerCommand.match(/flood|flooding|water\s*logging|overflow|river\s*flood|ගංවතුර|ජල\s*ගැලීම|පාත|வெள்ளம்|வெள்\s*ளம்|நீர்\s*வெள்ளம்|ஆற்று\s*வெள்ளம்|வெல்லம்|வெல்\s*லம்/i)) {
      setFormData(prev => ({ ...prev, incidentType: 'Flood' }));
      updateMessage = '✅ Flood selected';
      commandProcessed = true;
      console.log('✅ MATCHED: Flood');
    } else if (lowerCommand.match(/road\s*block|roadblock|road\s*blocked|tree\s*fall|tree\s*down|obstacle|block|මාර්ග\s*අවහිරතා|මාර්ගය\s*අවහිර|ගස\s*වැටී|சாலை\s*தடை|சாலை\s*அடைப்பு|மரம்\s*விழுந்தது|சாலைதடை/i)) {
      setFormData(prev => ({ ...prev, incidentType: 'Road Block' }));
      updateMessage = '✅ Road Block selected';
      commandProcessed = true;
      console.log('✅ MATCHED: Road Block');
    } else if (lowerCommand.match(/power\s*line|powerline|electricity|electric\s*line|cable\s*down|wire\s*down|විදුලි\s*රැහැන්|විදුලි\s*රැහැන්\s*කඩා|කේබලය|மின்\s*கம்பி|மின்சார\s*கம்பி|கம்பி\s*விழுந்தது|மின்கம்பி/i)) {
      setFormData(prev => ({ ...prev, incidentType: 'Power Line Down' }));
      updateMessage = '✅ Power Line Down selected';
      commandProcessed = true;
      console.log('✅ MATCHED: Power Line Down');
    } else {
      console.log('❌ No incident type matched');
    }

    // ENHANCED Multilingual Severity Detection with natural language
    if (lowerCommand.match(/critical|very dangerous|emergency|urgent|worst|severe|තීව්‍ර|ඉතා භයානක|හදිසි|முக்கியமான|மிக ஆபத்தான|அவசரம்|5|five/i)) {
      setFormData(prev => ({ ...prev, severity: '5' }));
      updateMessage = updateMessage ? updateMessage + ' - Critical severity' : 'Critical severity set';
      commandProcessed = true;
    } else if (lowerCommand.match(/high|dangerous|bad situation|serious|ඉහළ|භයානක|උயர්|நெருக்கடி|ஆபத்தான|4|four/i)) {
      setFormData(prev => ({ ...prev, severity: '4' }));
      updateMessage = updateMessage ? updateMessage + ' - High severity' : 'High severity set';
      commandProcessed = true;
    } else if (lowerCommand.match(/medium|moderate|average|normal|මධ්‍යම|සාමාන්‍ය|நடுத்தர|சாதாரண|3|three/i)) {
      setFormData(prev => ({ ...prev, severity: '3' }));
      updateMessage = updateMessage ? updateMessage + ' - Medium severity' : 'Medium severity set';
      commandProcessed = true;
    } else if (lowerCommand.match(/low|minor|small|not serious|අඩු|සුළු|குறைவான|சிறிய|2|two/i)) {
      setFormData(prev => ({ ...prev, severity: '2' }));
      updateMessage = updateMessage ? updateMessage + ' - Low severity' : 'Low severity set';
      commandProcessed = true;
    } else if (lowerCommand.match(/minimal|very low|tiny|negligible|අවම|ඉතා අඩු|குறைந்தபட்ச|மிக குறைவு|1|one/i)) {
      setFormData(prev => ({ ...prev, severity: '1' }));
      updateMessage = updateMessage ? updateMessage + ' - Minimal severity' : 'Minimal severity set';
      commandProcessed = true;
    }

    // Clear command - multilingual
    if (lowerCommand.match(/clear description|delete description|remove description|විස්තරය මකන්න|விளக்கத்தை அழி/i)) {
      setFormData(prev => ({ ...prev, description: '' }));
      updateMessage = 'Description cleared';
      commandProcessed = true;
    }

    // Show feedback for recognized commands
    if (updateMessage) {
      setTranscript(updateMessage);
      setTimeout(() => setTranscript(''), 3000);
    }

    // Description append (only if not a control command)
    if (!lowerCommand.match(/submit|save|clear|ඉදිරිපත්|සුරකින්න|මකන්න|சமர்ப்பிக்க|சேமி|அழி|landslide|flood|road|power|critical|high|medium|low|minimal|severity|level/i) && !commandProcessed) {
      setFormData(prev => ({ 
        ...prev, 
        description: prev.description ? `${prev.description} ${command}` : command 
      }));
      setTranscript('Added to description');
      setTimeout(() => setTranscript(''), 2000);
    }

    // Submit command (multilingual)
    if (lowerCommand.match(/submit report|submit|save report|send report|වාර්තාව යවන්න|වාර්තාව ඉදිරිපත්|அறிக்கையை அனுப்பு|சமர்ப்பிக்க/i)) {
      setTranscript('Submitting report...');
      setTimeout(() => {
        document.querySelector('form')?.requestSubmit();
      }, 500);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      showNotification('Voice recognition not supported. Please use Chrome, Edge, or Safari.', 'error');
      return;
    }

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
        console.error('Could not start recognition:', e);
        showNotification('Could not start voice recognition. Check microphone permissions.', 'error');
      }
    }
  };

  useEffect(() => {
    if (recognitionRef.current && !isListening) recognitionRef.current.lang = voiceLanguage;
  }, [voiceLanguage, isListening]);

  // Get language-specific hints
  const getVoiceHints = () => {
    switch(voiceLanguage) {
      case 'si-LK':
        return 'උදා: "ගංවතුර", "ඉතා භයානක", "වාර්තාව යවන්න"';
      case 'ta-LK':
        return 'எ.கா: "வெள்ளம்", "மிக ஆபத்தான", "அறிக்கையை அனுப்பு"';
      default:
        return 'Say: "Flood", "Critical", "Submit report"';
    }
  };

  const getListeningText = () => {
    switch(voiceLanguage) {
      case 'si-LK':
        return 'ඇසුරුම් කරයි...';
      case 'ta-LK':
        return 'கேட்கிறது...';
      default:
        return 'Listening...';
    }
  };

  // --- THE FIXED SYNC FUNCTION WITH RETRY LOGIC ---
  const syncDataToAPI = async (isRetry = false) => {
    if (isSyncing) return; // Prevent double syncs
    
    try {
      const unsyncedReports = await getUnsyncedReports();
      console.log('📤 Attempting to sync:', unsyncedReports.length, 'reports');
      
      if (unsyncedReports.length === 0) {
        setRetryCount(0); // Reset retry counter
        return;
      }

      setIsSyncing(true);
      let syncedCount = 0;
      let failedCount = 0;

      for (const report of unsyncedReports) {
        try {
          let photoURL = null;
          if (report.photo) {
            // Create a unique reference to prevent duplicates
            const imageRef = ref(storage, `reports/${report.id}_${Date.now()}.jpg`);
            await uploadString(imageRef, report.photo, 'data_url');
            photoURL = await getDownloadURL(imageRef);
          }

          // 2. Save Data to Firestore (with duplicate prevention)
          const reportsCollection = collection(db, "responderReports");
          const reportData = {
            incidentType: report.incidentType || "",
            severity: report.severity || "3",
            timestamp: report.timestamp,
            photo: photoURL,
            createdAt: new Date(report.createdAt),
            syncedAt: new Date(),
            responderID: auth.currentUser ? auth.currentUser.uid : "anonymous",
            localReportId: String(report.id), // Track local ID to prevent duplicates
          };
          
          // Only add fields if they exist and are not null/undefined
          if (report.latitude !== undefined && report.latitude !== null) {
            reportData.latitude = report.latitude;
          }
          if (report.longitude !== undefined && report.longitude !== null) {
            reportData.longitude = report.longitude;
          }
          if (report.description) {
            reportData.description = report.description;
          }
          
          const docRef = await addDoc(reportsCollection, reportData);
          console.log('✅ Report synced to Firebase:', docRef.id);

          // 3. Mark as synced in IndexedDB (don't delete so it shows in Past Reports)
          await markAsSynced(report.id);
          syncedCount++;

        } catch (innerErr) {
          console.error('❌ Failed to sync report:', report.id, innerErr);
          failedCount++;
          // Continue to the next report even if one fails
        }
      }

      if (syncedCount > 0) {
        showNotification(`${syncedCount} report${syncedCount > 1 ? 's' : ''} synced to HQ successfully`, 'success');
        setRetryCount(0); // Reset retry counter on success
      }
      
      // If some failed, schedule retry
      if (failedCount > 0 && retryCount < 3) {
        const retryDelay = Math.min(5000 * Math.pow(2, retryCount), 30000); // Exponential backoff: 5s, 10s, 20s, max 30s
        console.log(`⏳ ${failedCount} reports failed. Retrying in ${retryDelay/1000}s... (Attempt ${retryCount + 1}/3)`);
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          syncDataToAPI(true);
        }, retryDelay);
      } else if (failedCount > 0) {
        showNotification(`${failedCount} report${failedCount > 1 ? 's' : ''} failed to sync after 3 attempts. Will retry when online.`, 'error');
        setRetryCount(0);
      }
      
    } catch (err) {
      console.error('Sync error:', err);
      
      // Retry logic for network errors
      if (retryCount < 3) {
        const retryDelay = Math.min(5000 * Math.pow(2, retryCount), 30000);
        console.log(`⏳ Sync failed. Retrying in ${retryDelay/1000}s... (Attempt ${retryCount + 1}/3)`);
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          syncDataToAPI(true);
        }, retryDelay);
      } else {
        showNotification('Failed to sync reports after 3 attempts. Will retry when online.', 'error');
        setRetryCount(0);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearDB = async () => {
    if (!window.confirm("Are you sure you want to delete ALL reports from local storage?")) return;
    setIsClearing(true);
    try {
      await clearAllReports();
      showNotification('All local reports cleared successfully', 'success');
      // Reset form
      setFormData({ incidentType: "", severity: "3", description: "", photo: null, latitude: null, longitude: null });
    } catch (err) {
      console.error('Clear error:', err);
      showNotification('Failed to clear local storage', 'error');
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
    
    if (!formData.incidentType) {
      showNotification('Please select an incident type', 'warning');
      return;
    }
    
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
        .then((id) => {
          console.log('💾 Report saved to IndexedDB with ID:', id);
          
          if (isOnline) {
            showNotification('Report saved! Syncing to HQ...', 'success');
            // Trigger sync immediately if online
            syncDataToAPI();
          } else {
            showNotification('Report saved locally. Will sync when connection restored.', 'info');
          }
          // Reset form
          setFormData({ incidentType: "", severity: "3", description: "", photo: null, latitude: formData.latitude, longitude: formData.longitude });
        })
        .catch(err => { 
            console.error('Save error:', err);
            showNotification('Failed to save report. Please try again.', 'error'); 
        });
    });
  };

  return (
    <div style={styles.screen} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'success' ? '#10b981' : 
                          notification.type === 'error' ? '#ef4444' : 
                          notification.type === 'warning' ? '#f59e0b' : '#3b82f6'
        }}>
          <span style={styles.notificationIcon}>
            {notification.type === 'success' ? '✓' : 
             notification.type === 'error' ? '✕' : 
             notification.type === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span style={styles.notificationText}>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            style={styles.notificationClose}
          >
            ✕
          </button>
        </div>
      )}
      
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{...styles.statusSymbol, backgroundColor: isOnline ? "#16a34a" : "#991b1b"}} title={isOnline ? "Online" : "Offline"}></div>

          <div style={styles.headerContent}>
            <div style={styles.icon}>🚨</div>
            <h1 style={styles.title}>Incident Report</h1>
            <p style={styles.subtitle}>Field responder submission</p>
            
            {/* User Info Display */}
            {userProfile && (
              <div style={styles.userInfo}>
                <span style={styles.userIcon}>👤</span>
                <span style={styles.userName}>
                  {userProfile.name !== 'Responder' ? userProfile.name : userProfile.email}
                </span>
              </div>
            )}
            
            {/* Language Controls */}
            <div style={styles.languageControlsWrapper}>
              <div style={styles.languageControl}>
                <label style={styles.miniLabel}>Display Language</label>
                <select 
                  value={uiLanguage} 
                  onChange={(e) => setUiLanguage(e.target.value)}
                  style={styles.miniSelect}
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="si">සිං Sinhala</option>
                  <option value="ta">த Tamil</option>
                </select>
              </div>
              
              <div style={styles.languageControl}>
                <label style={styles.miniLabel}>{t.voiceLanguage}</label>
                <select 
                  value={voiceLanguage} 
                  onChange={(e) => setVoiceLanguage(e.target.value)}
                  style={styles.miniSelect}
                  disabled={isListening}
                >
                  <option value="en-US">🇬🇧 English</option>
                  <option value="si-LK">සිං Sinhala</option>
                  <option value="ta-LK">த Tamil</option>
                </select>
              </div>
            </div>
            
            {/* Voice Input Controls */}
            <div style={styles.voiceControls}>
              
              <button 
                type="button"
                onClick={toggleVoiceInput}
                style={{
                  ...styles.voiceButton,
                  background: isListening ? '#dc2626' : '#8B2E2E',
                  animation: isListening ? 'pulse 1.5s infinite' : 'none'
                }}
              >
                {isListening ? `🎙️ ${t.listening}` : `🎙️ ${t.startListening}`}
              </button>
            </div>
            
            {isListening && (
              <div style={styles.voiceIndicator}>
                <p style={styles.voiceTranscript}>
                  {interimText ? (
                    <span style={{opacity: 0.6, fontStyle: 'italic'}}>🎤 {interimText}</span>
                  ) : transcript ? (
                    <span style={{color: '#10b981', fontWeight: 'bold'}}>✓ {transcript}</span>
                  ) : (
                    <span style={{opacity: 0.7}}>Speak now...</span>
                  )}
                </p>
                <p style={styles.voiceHint}>
                  {getVoiceHints()}
                </p>
                <p style={styles.voiceStatus}>🎤 Microphone active - Continuous listening mode</p>
              </div>
            )}
          </div>

          {isSyncing && <p style={styles.syncText}>Syncing…</p>}
          {formData.latitude && formData.longitude && (
            <MapDisplay latitude={formData.latitude} longitude={formData.longitude} incidentType={formData.incidentType || "Incident"} />
          )}

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t.incidentType}</label>
              <select name="incidentType" value={formData.incidentType} onChange={handleChange} required style={styles.input}>
                <option value="">{t.selectIncident}</option>
                <option value="Landslide">{t.landslide}</option>
                <option value="Flood">{t.flood}</option>
                <option value="Road Block">{t.roadBlock}</option>
                <option value="Power Line Down">{t.powerLineDown}</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t.severity}</label>
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
              <label style={styles.label}>{t.description}</label>
              <textarea rows={4} placeholder={t.descriptionPlaceholder} name="description" value={formData.description} onChange={handleChange} style={styles.textarea} />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t.capturePhoto}</label>
              <div style={styles.photoInputContainer}>
                <input type="file" name="photo" accept="image/*" onChange={handleChange} style={styles.photoInput} />
                {formData.photo ? (
                  <img src={URL.createObjectURL(formData.photo)} alt="preview" style={styles.imagePreviewInside} />
                ) : (
                  <span style={styles.photoPlaceholder}>{t.capturePhoto}</span>
                )}
              </div>
            </div>

            <button type="submit" style={styles.button}>{t.submit}</button>
          </form>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
  {/* Button to view pending reports */}
  <button
    type="button"
    onClick={() => navigate("/pending-reports")}
    style={{ ...styles.button, flex: 1, background: "#8B2E2E", fontSize: "0.85rem" }}
  >{t.pendingReports}
  </button>

  {/* Button to view past reports */}
  <button
    type="button"
    onClick={() => navigate("/past-reports")}
    style={{ ...styles.button, flex: 1, background: "#8B2E2E", fontSize: "0.85rem"  }}
  >{t.pastReports}
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
  userInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    marginTop: "0.75rem",
    padding: "0.5rem 1rem",
    background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
    borderRadius: "20px",
    border: "2px solid #8B2E2E",
  },
  userIcon: {
    fontSize: "1.2rem",
  },
  userName: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#8B2E2E",
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
  },
  voiceControls: {
    marginTop: '1rem',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  languageControlsWrapper: {
    marginTop: '1rem',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  languageControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  miniLabel: {
    fontSize: '0.7rem',
    color: '#8B2E2E',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  miniSelect: {
    padding: '0.5rem',
    borderRadius: '8px',
    border: '2px solid #8B2E2E',
    background: '#fff',
    color: '#8B2E2E',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
  },
  languageSelect: {
    padding: '0.75rem',
    borderRadius: '12px',
    border: '2px solid #8B2E2E',
    background: '#fff',
    color: '#8B2E2E',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
  },
  voiceButton: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    borderRadius: '15px',
    border: 'none',
    color: '#fff',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    transition: 'all 0.3s ease',
  },
  voiceIndicator: {
    marginTop: '1rem',
    padding: '1rem',
    background: '#fef3c7',
    borderRadius: '12px',
    border: '2px solid #f59e0b',
  },
  voiceTranscript: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#92400e',
    marginBottom: '0.5rem',
    minHeight: '1.5rem',
  },
  voiceHint: {
    fontSize: '0.75rem',
    color: '#78350f',
    fontStyle: 'italic',
    marginBottom: '0.25rem',
  },
  voiceStatus: {
    fontSize: '0.7rem',
    color: '#059669',
    fontWeight: '600',
    marginTop: '0.5rem',
  },
  notification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    left: '20px',
    maxWidth: '500px',
    margin: '0 auto',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: '600',
    fontSize: '0.95rem',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    animation: 'slideDown 0.3s ease',
  },
  notificationIcon: {
    fontSize: '1.2rem',
    fontWeight: '700',
  },
  notificationText: {
    flex: 1,
  },
  notificationClose: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0',
    opacity: 0.8,
    transition: 'opacity 0.2s',
  }
};

// Add pulse and slideDown animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styleSheet);

export default ResponderForm;
