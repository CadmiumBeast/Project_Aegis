// import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function PastReports() {
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedReports = JSON.parse(localStorage.getItem("responderReports")) || [];
    setReports(storedReports);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Past Reports</h2>
        {reports.length === 0 ? <p>No reports yet.</p> :
          reports.map((r,i)=>(
            <div key={i} style={styles.reportCard}>
              <p><strong>Incident:</strong> {r.incidentType}</p>
              <p><strong>Severity:</strong> {r.severity}</p>
              {r.photo && <p>📷 Photo attached</p>}
              <p><strong>Time:</strong> {r.timestamp}</p>
            </div>
          ))
        }
        <button style={styles.button} onClick={()=>navigate("/responder-form")}>
          Back to Form
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight:"100vh", display:"flex", justifyContent:"center", alignItems:"center", fontFamily:"Arial", background:"linear-gradient(135deg, #8B1E3F, #F7C1A1)" },
  card: { background:"#FFF3EC", padding:"25px", borderRadius:"16px", boxShadow:"0 15px 30px rgba(0,0,0,0.2)", textAlign:"center", width:"380px", maxHeight:"90vh", overflowY:"auto" },
  title: { marginBottom:"15px", color:"#8B1E3F" },
  reportCard: { background:"#F7C1A1", padding:"10px", borderRadius:"10px", marginBottom:"10px", fontSize:"13px", textAlign:"left" },
  button: { backgroundColor:"#8B1E3F", color:"#fff", padding:"12px", borderRadius:"10px", border:"none", cursor:"pointer", marginTop:"10px" },
};

export default PastReports;
