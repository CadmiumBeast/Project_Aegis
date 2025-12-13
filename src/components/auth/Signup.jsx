

// export default Signup;
function Signup({ switchToLogin, onSuccess }) {
  return (
    <>
      <h2 style={styles.title}>Create Account</h2>
      <p style={styles.subtitle}>Sign up to get started</p>

      <form style={styles.form}>
        <input type="text" placeholder="Full Name" style={styles.input} />
        <input type="tel" placeholder="Contact Number" style={styles.input} />
        <input type="password" placeholder="Password" style={styles.input} />
        <input type="password" placeholder="Confirm Password" style={styles.input} />

        <button
          type="button"
          style={styles.button}
          onClick={onSuccess} // triggers navigation to form
        >
          Sign Up
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

const styles = {
  title: { color: "#8B1E3F" },
  subtitle: { fontSize: "14px", color: "#555", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #F7C1A1",
  },
  button: {
    backgroundColor: "#8B1E3F",
    color: "#fff",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
  },
  footerText: { marginTop: "20px", fontSize: "13px" },
  link: { color: "#8B1E3F", fontWeight: "bold", cursor: "pointer" },
};

export default Signup;
