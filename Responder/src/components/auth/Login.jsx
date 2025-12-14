
// export default Login;

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";

function Login({ switchToSignup, onSuccess, isDarkMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login timestamp in Firestore
      try {
        await updateDoc(doc(db, 'users', userCredential.user.uid), {
          lastLogin: serverTimestamp()
        });
      } catch (updateError) {
        console.warn('Could not update last login:', updateError);
      }
      
      onSuccess();
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const styles = isDarkMode ? dark : light;

  return (
    <div style={styles.screen}>
      <div style={styles.container}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.headerContent}>
            <div style={styles.icon}>🚨</div>
            <h1 style={styles.title}>Responder Login</h1>
            <p style={styles.subtitle}>
              Secure access for disaster response teams
            </p>
          </div>

          {/* Error */}
          {error && <div style={styles.error}>{error}</div>}

          {/* Form */}
          <form style={styles.form} onSubmit={handleLogin}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => {
                  Object.assign(e.target.style, styles.inputFocus || {});
                }}
                onBlur={(e) => {
                  e.target.style.border = styles.input.border;
                  e.target.style.boxShadow = 'none';
                }}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => {
                  Object.assign(e.target.style, styles.inputFocus || {});
                }}
                onBlur={(e) => {
                  e.target.style.border = styles.input.border;
                  e.target.style.boxShadow = 'none';
                }}
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  Object.assign(e.target.style, styles.buttonHover || {});
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = styles.button.background;
                  e.target.style.boxShadow = styles.button.boxShadow;
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>

          {/* Footer */}
          <p style={styles.footer}>
            New responder?{" "}
            <span 
              style={styles.link} 
              onClick={switchToSignup}
              onMouseEnter={(e) => {
                Object.assign(e.target.style, styles.linkHover || {});
              }}
              onMouseLeave={(e) => {
                e.target.style.color = styles.link.color;
                e.target.style.textDecoration = 'none';
              }}
            >
              Create an account
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================
   MOBILE-FIRST BASE STYLES
========================= */

const base = {
  screen: {
    minHeight: "100svh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(0.75rem, 3vw, 1rem)",
    background: "linear-gradient(135deg, #8B2E2E 0%, #A03A3A 100%)",
  },
  container: {
    width: "100%",
    maxWidth: "min(450px, 95vw)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "clamp(1.5rem, 5vw, 2rem)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  headerContent: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  icon: {
    fontSize: "3rem",
    marginBottom: "0.5rem",
    display: "block",
  },
  title: {
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    fontWeight: "700",
    margin: "0 0 0.5rem 0",
    color: "#8B2E2E",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
    marginTop: "0.5rem",
    lineHeight: "1.5",
    color: "#666",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    width: "100%",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#333",
    marginBottom: "0.25rem",
  },
  input: {
    height: "clamp(48px, 6vw, 52px)",
    padding: "0 clamp(0.75rem, 3vw, 1rem)",
    borderRadius: "10px",
    fontSize: "clamp(0.9375rem, 2.5vw, 1rem)",
    outline: "none",
    border: "2px solid #e0e0e0",
    background: "#fff",
    color: "#213547",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  button: {
    height: "clamp(48px, 6vw, 52px)",
    marginTop: "0.5rem",
    borderRadius: "10px",
    fontSize: "clamp(0.9375rem, 2.5vw, 1rem)",
    fontWeight: "700",
    border: "none",
    cursor: "pointer",
    background: "#8B2E2E",
    color: "#fff",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    boxShadow: "0 4px 12px rgba(139, 46, 46, 0.3)",
    width: "100%",
  },
  footer: {
    marginTop: "1.5rem",
    fontSize: "0.875rem",
    textAlign: "center",
    color: "#666",
    lineHeight: "1.5",
  },
  link: {
    fontWeight: "600",
    cursor: "pointer",
    color: "#8B2E2E",
    textDecoration: "none",
    transition: "color 0.2s ease",
  },
  error: {
    padding: "0.875rem 1rem",
    borderRadius: "10px",
    fontSize: "0.875rem",
    textAlign: "center",
    marginBottom: "1rem",
    background: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    fontWeight: "500",
  },
};

/* LIGHT THEME - Matching HQ Admin Theme */
const light = {
  ...base,
  input: {
    ...base.input,
    background: "#fff",
    border: "2px solid #e0e0e0",
    color: "#213547",
  },
  inputFocus: {
    border: "2px solid #8B2E2E",
    boxShadow: "0 0 0 3px rgba(139, 46, 46, 0.1)",
  },
  button: {
    ...base.button,
    background: "#8B2E2E",
    color: "#fff",
  },
  buttonHover: {
    background: "#A03A3A",
    boxShadow: "0 6px 16px rgba(139, 46, 46, 0.4)",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  link: { 
    ...base.link, 
    color: "#8B2E2E",
  },
  linkHover: {
    color: "#A03A3A",
    textDecoration: "underline",
  },
};

/* DARK THEME - Keeping dark theme but with admin colors */
const dark = {
  ...base,
  screen: {
    ...base.screen,
    background: "linear-gradient(135deg, #8B2E2E 0%, #A03A3A 100%)",
  },
  card: {
    ...base.card,
    background: "#1a1a1a",
    border: "1px solid #333",
  },
  title: { ...base.title, color: "#8B2E2E" },
  subtitle: { ...base.subtitle, color: "#aaa" },
  label: { ...base.label, color: "#ccc" },
  input: {
    ...base.input,
    background: "#121212",
    border: "2px solid #333",
    color: "#fff",
  },
  inputFocus: {
    border: "2px solid #8B2E2E",
    boxShadow: "0 0 0 3px rgba(139, 46, 46, 0.2)",
  },
  button: {
    ...base.button,
    background: "#8B2E2E",
    color: "#fff",
  },
  buttonHover: {
    background: "#A03A3A",
  },
  link: { ...base.link, color: "#8B2E2E" },
  error: {
    ...base.error,
    background: "#2a2a2a",
    color: "#dc2626",
    border: "1px solid #dc2626",
  },
};

export default Login;