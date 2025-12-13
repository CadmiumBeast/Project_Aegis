// src/components/SplashScreen.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);

    const timer = setTimeout(() => {
      navigate("/auth");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.logo,
          transform: animate ? "scale(1)" : "scale(0)",
          opacity: animate ? 1 : 0,
          transition: "all 1.5s ease-in-out",
        }}
      >
        🚨
      </div>
      <h1 style={styles.title}>Disaster Response PWA</h1>
      <p style={styles.subtitle}>Stay ready. Stay safe.</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #8B1E3F, #F7C1A1)",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    gap: "15px",
  },
  logo: { fontSize: "80px" },
  title: { fontSize: "28px", fontWeight: "bold" },
  subtitle: { fontSize: "16px" },
};
