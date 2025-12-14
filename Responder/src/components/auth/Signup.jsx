import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

function Signup({ switchToLogin, onSuccess }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !phone || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    // Phone number validation
    const phoneRegex = /^[0-9]{10}$/; // 10 digits
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    if (!phoneRegex.test(cleanPhone)) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with name
      await updateProfile(user, {
        displayName: name
      });
      
      // Save user details to Firestore 'users' collection
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        phone: phone,
        number: phone, // Also store as 'number' for compatibility
        role: 'responder',
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      console.log('✅ User profile created:', user.uid);
      onSuccess();
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.screen}>
      <div style={styles.container}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.headerContent}>
            <div style={styles.icon}>🚨</div>
            <h1 style={styles.title}>Create Account</h1>
            <p style={styles.subtitle}>
              Register as a disaster response responder
            </p>
          </div>

          {/* Error */}
          {error && <div style={styles.error}>{error}</div>}

          {/* Form */}
          <form style={styles.form} onSubmit={handleSignup}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => {
                  e.target.style.border = "2px solid #8B2E2E";
                  e.target.style.boxShadow = "0 0 0 3px rgba(139, 46, 46, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "2px solid #e0e0e0";
                  e.target.style.boxShadow = "none";
                }}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                placeholder="10 digit phone number (e.g., 0771234567)"
                style={styles.input}
                value={phone}
                onChange={(e) => {
                  // Only allow digits
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setPhone(value);
                  }
                }}
                onFocus={(e) => {
                  e.target.style.border = "2px solid #8B2E2E";
                  e.target.style.boxShadow = "0 0 0 3px rgba(139, 46, 46, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "2px solid #e0e0e0";
                  e.target.style.boxShadow = "none";
                }}
                disabled={loading}
                maxLength={10}
              />
              <span style={styles.hint}>
                {phone.length > 0 && `${phone.length}/10 digits`}
              </span>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => {
                  e.target.style.border = "2px solid #8B2E2E";
                  e.target.style.boxShadow = "0 0 0 3px rgba(139, 46, 46, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "2px solid #e0e0e0";
                  e.target.style.boxShadow = "none";
                }}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => {
                  e.target.style.border = "2px solid #8B2E2E";
                  e.target.style.boxShadow = "0 0 0 3px rgba(139, 46, 46, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "2px solid #e0e0e0";
                  e.target.style.boxShadow = "none";
                }}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                style={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={(e) => {
                  e.target.style.border = "2px solid #8B2E2E";
                  e.target.style.boxShadow = "0 0 0 3px rgba(139, 46, 46, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "2px solid #e0e0e0";
                  e.target.style.boxShadow = "none";
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
                  e.target.style.background = "#A03A3A";
                  e.target.style.boxShadow = "0 6px 16px rgba(139, 46, 46, 0.4)";
                  e.target.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = "#8B2E2E";
                  e.target.style.boxShadow = "0 4px 12px rgba(139, 46, 46, 0.3)";
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          {/* Footer */}
          <p style={styles.footer}>
            Already have an account?{" "}
            <span 
              style={styles.link} 
              onClick={switchToLogin}
              onMouseEnter={(e) => {
                e.target.style.color = "#A03A3A";
                e.target.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#8B2E2E";
                e.target.style.textDecoration = "none";
              }}
            >
              Login
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

const styles = {
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
    maxHeight: "90vh",
    overflowY: "auto",
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
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
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
  hint: {
    fontSize: "0.75rem",
    color: "#8B2E2E",
    marginTop: "0.25rem",
    fontWeight: "500",
  },
};
export default Signup;
