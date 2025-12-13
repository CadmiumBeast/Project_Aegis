
// import React from "react";

// function Signup() {
//   return (
//     <div style={styles.container}>
//       <div style={styles.card}>
//         <h2 style={styles.title}>Sign Up</h2>
//         <p style={styles.subtitle}>Sign up to get started</p>

//         <form style={styles.form}>
//           <input
//             type="text"
//             placeholder="Full Name"
//             style={styles.input}
//           />

//           <input
//             type="tel"
//             placeholder="Contact Number"
//             style={styles.input}
//           />

//           <input
//             type="password"
//             placeholder="Password"
//             style={styles.input}
//           />

//           <input
//             type="password"
//             placeholder="Confirm Password"
//             style={styles.input}
//           />

//           <button type="submit" style={styles.button}>
//             Sign Up
//           </button>
//         </form>

//         <p style={styles.footerText}>
//           Already have an account? <span style={styles.link}>Login</span>
//         </p>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     height: "100vh",
//     background: "linear-gradient(135deg, #8B1E3F, #F7C1A1)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontFamily: "Arial, sans-serif",
//   },

//   card: {
//     backgroundColor: "#FFF3EC",
//     padding: "40px",
//     borderRadius: "16px",
//     width: "380px",
//     boxShadow: "0 15px 30px rgba(0,0,0,0.2)",
//     textAlign: "center",
//   },

//   title: {
//     color: "#8B1E3F",
//     marginBottom: "8px",
//   },

//   subtitle: {
//     color: "#555",
//     marginBottom: "24px",
//     fontSize: "14px",
//   },

//   form: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "14px",
//   },

//   input: {
//     padding: "12px",
//     borderRadius: "10px",
//     border: "1px solid #F7C1A1",
//     fontSize: "14px",
//     outline: "none",
//   },

//   button: {
//     backgroundColor: "#8B1E3F",
//     color: "#fff",
//     padding: "12px",
//     borderRadius: "10px",
//     border: "none",
//     fontSize: "16px",
//     cursor: "pointer",
//   },

//   footerText: {
//     marginTop: "20px",
//     fontSize: "13px",
//     color: "#555",
//   },

//   link: {
//     color: "#8B1E3F",
//     fontWeight: "bold",
//     cursor: "pointer",
//   },
// };

// export default Signup;
function Signup({ switchToLogin }) {
  return (
    <>
      <h2 style={styles.title}>Create Account</h2>
      <p style={styles.subtitle}>Sign up to get started</p>

      <form style={styles.form}>
        <input type="text" placeholder="Full Name" style={styles.input} />
        <input type="tel" placeholder="Contact Number" style={styles.input} />
        <input type="password" placeholder="Password" style={styles.input} />
        <input type="password" placeholder="Confirm Password" style={styles.input} />

        <button style={styles.button}>Sign Up</button>
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
