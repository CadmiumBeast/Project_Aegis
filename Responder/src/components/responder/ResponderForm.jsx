
// export default ResponderForm;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ResponderForm() {
  const [formData, setFormData] = useState({
    incidentType: "",
    severity: "3",
    photo: null,
  });
  const navigate = useNavigate();

  // Touch handling
  const [touchStartY, setTouchStartY] = useState(null);

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
    const newReport = { ...formData, timestamp: new Date().toLocaleString() };
    const storedReports = JSON.parse(localStorage.getItem("responderReports")) || [];
    localStorage.setItem("responderReports", JSON.stringify([newReport, ...storedReports]));
    alert("Report saved locally!");
    setFormData({ incidentType: "", severity: "3", photo: null });
  };

  return (
    <div
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div style={styles.card}>
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
