import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

function Signup({ switchToLogin, onSuccess, isDarkMode }) {
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName || !contactNumber || !email || !password || !confirmPassword) {
      setError("All fields are required");
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User signed up and logged in:", userCredential.user);
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const getTheme = () => {
    if (isDarkMode) {
      return {
        title: { color: "#FF6B9D" },
        subtitle: { fontSize: "14px", color: "#B0B0B0", marginBottom: "20px" },
        error: {
          color: "#FF6B9D",
          fontSize: "13px",
          marginBottom: "15px",
          padding: "8px",
          backgroundColor: "#2a2a2a",
          borderRadius: "4px",
          border: "1px solid #FF6B9D",
        },
        form: { display: "flex", flexDirection: "column", gap: "14px" },
        input: {
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #444",
          backgroundColor: "#2a2a2a",
          color: "#fff",
          fontSize: "14px",
        },
        button: {
          backgroundColor: "#FF6B9D",
          color: "#1a1a1a",
          padding: "12px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
        },
        footerText: { marginTop: "20px", fontSize: "13px", color: "#B0B0B0" },
        link: { color: "#FF6B9D", fontWeight: "bold", cursor: "pointer" },
      };
    }
    return {
      title: { color: "#8B1E3F" },
      subtitle: { fontSize: "14px", color: "#555", marginBottom: "20px" },
      error: {
        color: "#d32f2f",
        fontSize: "13px",
        marginBottom: "15px",
        padding: "8px",
        backgroundColor: "#ffebee",
        borderRadius: "4px",
      },
      form: { display: "flex", flexDirection: "column", gap: "14px" },
      input: {
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid #F7C1A1",
        backgroundColor: "#fff",
        color: "#000",
        fontSize: "14px",
      },
      button: {
        backgroundColor: "#8B1E3F",
        color: "#fff",
        padding: "12px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer",
        fontWeight: "600",
      },
      footerText: { marginTop: "20px", fontSize: "13px", color: "#555" },
      link: { color: "#8B1E3F", fontWeight: "bold", cursor: "pointer" },
    };
  };

  const styles = getTheme();

  return (
    <>
      <h2 style={styles.title}>Create Account</h2>
      <p style={styles.subtitle}>Sign up to get started</p>

      {error && <p style={styles.error}>{error}</p>}

      <form style={styles.form} onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Full Name"
          style={styles.input}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
        />
        <input
          type="tel"
          placeholder="Contact Number"
          style={styles.input}
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          disabled={loading}
        />
        <input
          type="email"
          placeholder="Email"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          style={styles.input}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>

      <p style={styles.footerText}>
        Already have an account?{" "}
        <span style={styles.link} onClick={switchToLogin}>
          Login
        </span>
      </p>
    </>
  );
}

const defaultStyles = {};

export default Signup;
