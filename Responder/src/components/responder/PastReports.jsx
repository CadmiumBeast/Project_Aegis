// import { useEffect, useState } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllReports, initDB } from "../../utils/indexedDB";

function PastReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        await initDB();
        const allReports = await getAllReports();
        setReports(allReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Past Reports</h2>
        {loading ? (
          <p>Loading reports...</p>
        ) : reports.length === 0 ? (
          <p>No reports yet.</p>
        ) : (
          reports.map((r) => (
            <div key={r.id} style={styles.reportCard}>
              <div style={styles.reportHeader}>
                <span><strong>Incident:</strong> {r.incidentType}</span>
                <span style={{
                  backgroundColor: r.synced ? "#27ae60" : "#e74c3c",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "bold"
                }}>
                  {r.synced ? "✓ Synced" : "⧗ Pending"}
                </span>
              </div>
              <p><strong>Severity:</strong> {r.severity}</p>
              {r.photo && <p>📷 {r.photo}</p>}
              <p style={{ fontSize: "12px", color: "#666" }}>
                <strong>Created:</strong> {new Date(r.createdAt).toLocaleString()}
              </p>
              {r.syncedAt && (
                <p style={{ fontSize: "12px", color: "#666" }}>
                  <strong>Synced:</strong> {new Date(r.syncedAt).toLocaleString()}
                </p>
              )}
            </div>
          ))
        )}
        <button style={styles.button} onClick={() => navigate("/responder-form")}>
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
  reportHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" },
  button: { backgroundColor:"#8B1E3F", color:"#fff", padding:"12px", borderRadius:"10px", border:"none", cursor:"pointer", marginTop:"10px" },
};

export default PastReports;
