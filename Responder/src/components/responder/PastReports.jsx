

// export default PastReports;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllReports, initDB } from "../../utils/indexedDB";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db, auth } from "../../firebase";
import MapDisplay from "../MapDisplay";

function PastReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        await initDB();

        const localReports = await getAllReports();

        let firebaseReports = [];
        if (auth.currentUser) {
          const reportsRef = collection(db, "responderReports");
          const q = query(
            reportsRef,
            where("responderID", "==", auth.currentUser.uid)
          );
          const snapshot = await getDocs(q);

          firebaseReports = snapshot.docs.map((doc) => ({
            id: "firebase_" + doc.id,
            ...doc.data(),
            synced: true,
            fromFirebase: true,
          }));
        }

        const allReports = [...localReports, ...firebaseReports];

        allReports.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        setReports(allReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    const handleVisibilityChange = () => {
      if (!document.hidden) fetchReports();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <div style={styles.screen}>
      <div style={styles.container}>
        <div style={styles.card}>
          {/* 🔙 Top-right back button */}
          <button
            style={styles.backButton}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ←
          </button>

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

                <p style={styles.reportText}>
                  <strong>Severity:</strong> {r.severity}
                </p>

                {r.description && (
                  <p style={styles.reportText}>
                    <strong>Description:</strong> {r.description}
                  </p>
                )}

                {r.latitude && r.longitude && (
                  <>
                    <MapDisplay
                      latitude={r.latitude}
                      longitude={r.longitude}
                      incidentType={r.incidentType}
                    />
                    <p style={styles.reportText}>
                      <strong>Coordinates:</strong>{" "}
                      {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                    </p>
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
                  <strong>Created:</strong>{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </p>

                {r.syncedAt && (
                  <p style={styles.timestamp}>
                    <strong>Synced:</strong>{" "}
                    {new Date(r.syncedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))
          )}

          <button
            style={styles.button}
            onClick={() => navigate("/responder-form")}
          >
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
    position: "relative",
    background: "#fff",
    borderRadius: "20px",
    padding: "2rem",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  backButton: {
    position: "absolute",
    top: "15px",
    right: "15px",
    background: "#8B2E2E",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    fontSize: "1.2rem",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
  reportText: { fontSize: "0.95rem", color: "#333" },
  timestamp: { fontSize: "0.8rem", color: "#666" },
  reportImage: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    borderRadius: "10px",
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
  },
};

export default PastReports;