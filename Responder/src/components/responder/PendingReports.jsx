

// export default PastReports;



import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllReports, initDB } from "../../utils/indexedDB";
import MapDisplay from "../MapDisplay";

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
        // Error fetching reports handled silently
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    // Refresh reports when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchReports();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <div style={styles.screen}>
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Past Reports</h2>
          {loading ? (
            <p style={styles.loading}>Loading reports…</p>
          ) : reports.length === 0 ? (
            <p style={styles.noReports}>No reports yet.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} style={styles.reportCard}>
                <div style={styles.reportHeader}>
                  <span style={styles.incidentType}>{r.incidentType}</span>
                  <span
                    style={{
                      ...styles.syncStatus,
                      backgroundColor: r.synced ? "#16a34a" : "#991b1b",
                    }}
                  >
                    {r.synced ? "✓ Synced" : "⧗ Pending"}
                  </span>
                </div>
                <p style={styles.reportText}><strong>Severity:</strong> {r.severity}</p>
                {r.description && <p style={styles.reportText}><strong>Description:</strong> {r.description}</p>}
                {r.latitude && r.longitude && (
                  <>
                    <MapDisplay latitude={r.latitude} longitude={r.longitude} incidentType={r.incidentType} />
                    <p style={styles.reportText}><strong>Coordinates:</strong> {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</p>
                  </>
                )}
                {r.photo && (
                  <img
                    src={r.photo}
                    alt="report"
                    style={styles.reportImage}
                  />
                )}
                <p style={styles.timestamp}>
                  <strong>Created:</strong> {new Date(r.createdAt).toLocaleString()}
                </p>
                {r.syncedAt && (
                  <p style={styles.timestamp}>
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
    </div>
  );
}

const styles = {
  screen: {
    minHeight: "100svh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #8B2E2E, #3a0d0d)",
    fontFamily: "'Roboto', sans-serif",
    padding: "2rem",
  },
  container: { width: "100%", maxWidth: "500px" },
  card: {
    background: "#fff",
    borderRadius: "20px",
    padding: "2rem",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 10px #00000020 inset",
    border: "1px solid rgba(0,0,0,0.1)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#8B2E2E",
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  loading: { textAlign: "center", fontStyle: "italic", color: "#555" },
  noReports: { textAlign: "center", fontStyle: "italic", color: "#777" },
  reportCard: {
    background: "#f9f9f9",
    borderRadius: "12px",
    padding: "15px",
    marginBottom: "12px",
    border: "1px solid #e0e0e0",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  reportHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  incidentType: {
    fontWeight: "700",
    fontSize: "1rem",
    color: "#8B2E2E",
  },
  syncStatus: {
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  reportText: { fontSize: "0.95rem", marginBottom: "6px", color: "#333" },
  timestamp: { fontSize: "0.8rem", color: "#666", marginTop: "2px" },
  reportImage: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    borderRadius: "10px",
    marginBottom: "6px",
    marginTop: "6px",
  },
  button: {
    width: "100%",
    backgroundColor: "#8B2E2E",
    color: "#fff",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    marginTop: "15px",
    fontSize: "1rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    transition: "0.2s",
  },
};

export default PastReports;
