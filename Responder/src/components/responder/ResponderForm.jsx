
// export default ResponderForm;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveReport, initDB, getUnsyncedReports, markAsSynced } from "../../utils/indexedDB";

function ResponderForm() {
  const [formData, setFormData] = useState({
    incidentType: "",
    severity: "3",
    photo: null,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const navigate = useNavigate();

  // Initialize IndexedDB on mount
  useEffect(() => {
    initDB().catch(err => console.error("Failed to initialize IndexedDB:", err));
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncDataToAPI();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync unsynced reports to API when online
  const syncDataToAPI = async () => {
    setIsSyncing(true);
    try {
      const unsyncedReports = await getUnsyncedReports();

      for (const report of unsyncedReports) {
        try {
          // Replace with your actual API endpoint
          const response = await fetch("YOUR_API_ENDPOINT/reports", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              incidentType: report.incidentType,
              severity: report.severity,
              timestamp: report.timestamp,
              // For now, we can't send photos, just metadata
            }),
          });

          if (response.ok) {
            await markAsSynced(report.id);
            console.log("Report synced:", report.id);
          }
        } catch (error) {
          console.error("Failed to sync report:", error);
          // Keep the report unsynced for retry
        }
      }
      if (unsyncedReports.length > 0) {
        alert(`${unsyncedReports.length} report(s) synced to server!`);
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartY) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY;

    if (deltaY < -100) {
      // swipe up detected
      navigate("/past-reports");
    }
    setTouchStartY(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") setFormData({ ...formData, photo: files[0] });
    else setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newReport = { 
      incidentType: formData.incidentType,
      severity: formData.severity,
      timestamp: new Date().toLocaleString(),
      photo: formData.photo ? formData.photo.name : null, // Store filename instead of file object
    };

    // Save to IndexedDB
    saveReport(newReport)
      .then((id) => {
        alert(
          isOnline 
            ? "Report saved and queued for sync!" 
            : "Report saved locally! Will sync when internet returns."
        );
        setFormData({ incidentType: "", severity: "3", photo: null });
        
        // If online, attempt sync immediately
        if (isOnline) {
          syncDataToAPI();
        }
      })
      .catch((error) => {
        console.error("Error saving report:", error);
        alert("Failed to save report. Please try again.");
      });
  };

  return (
    <div
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div style={styles.card}>
        <div style={styles.statusBar}>
          <span style={{
            color: isOnline ? "#27ae60" : "#e74c3c",
            fontWeight: "bold",
            fontSize: "12px"
          }}>
            {isOnline ? "🟢 Online" : "🔴 Offline"}
          </span>
          {isSyncing && <span style={{ marginLeft: "10px", color: "#f39c12" }}>⏳ Syncing...</span>}
        </div>
        <h2 style={styles.title}>Responder Report Form</h2>
        <form style={styles.form} onSubmit={handleSubmit}>
          <label style={styles.label}>
            Incident Type:
            <select name="incidentType" value={formData.incidentType} onChange={handleChange} required style={styles.input}>
              <option value="">Select</option>
              <option value="Landslide">Landslide</option>
              <option value="Flood">Flood</option>
              <option value="Road Block">Road Block</option>
              <option value="Power Line Down">Power Line Down</option>
            </select>
          </label>

          <div style={styles.severityContainer}>
            <label style={styles.label}>Severity:</label>
            <div style={styles.radioGroup}>
              {["1-Critical","2","3","4","5-Low"].map((level,index)=>(
                <label key={index} style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="severity"
                    value={index+1}
                    checked={formData.severity===String(index+1)}
                    onChange={handleChange}
                    required
                  />
                  <span style={{ fontSize: "12px", marginTop:"4px"}}>{level}</span>
                </label>
              ))}
            </div>
          </div>

          <label style={styles.label}>
            Photo (optional):
            <input type="file" name="photo" accept="image/*" onChange={handleChange} style={styles.input}/>
          </label>

          <button type="submit" style={styles.button}>Save Report</button>
        </form>
        <p style={styles.note}>Swipe up to view past reports</p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight:"100vh", display:"flex", justifyContent:"center", alignItems:"center", fontFamily:"Arial", background:"linear-gradient(135deg, #8B1E3F, #F7C1A1)" },
  card: { background:"#FFF3EC", padding:"25px", borderRadius:"16px", boxShadow:"0 15px 30px rgba(0,0,0,0.2)", textAlign:"center", width:"380px" },
  statusBar: { display:"flex", justifyContent:"center", alignItems:"center", marginBottom:"15px", padding:"8px", backgroundColor:"#f0f0f0", borderRadius:"8px" },
  title: { marginBottom:"15px", color:"#8B1E3F" },
  form: { display:"flex", flexDirection:"column", gap:"12px" },
  label: { display:"flex", flexDirection:"column", textAlign:"left", fontSize:"14px", color:"#333" },
  input: { marginTop:"5px", padding:"10px", borderRadius:"10px", border:"1px solid #F7C1A1" },
  severityContainer: { display:"flex", flexDirection:"column", alignItems:"flex-start" },
  radioGroup: { display:"flex", justifyContent:"space-between", width:"100%", marginTop:"5px" },
  radioLabel: { display:"flex", flexDirection:"column", alignItems:"center" },
  button: { backgroundColor:"#8B1E3F", color:"#fff", padding:"12px", borderRadius:"10px", border:"none", cursor:"pointer", marginTop:"10px" },
  note: { marginTop:"12px", fontSize:"12px", color:"#555" },
};

export default ResponderForm;
