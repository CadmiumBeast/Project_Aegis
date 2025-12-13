function Login({ switchToSignup }) {
    return (
      <>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Login to continue</p>
  
        <form style={styles.form}>
          <input type="email" placeholder="Email" style={styles.input} />
          <input type="password" placeholder="Password" style={styles.input} />
  
          <button style={styles.button}>Login</button>
        </form>
  
        <p style={styles.footerText}>
          Don’t have an account?{" "}
          <span style={styles.link} onClick={switchToSignup}>
            Sign up
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
  
  export default Login;
  