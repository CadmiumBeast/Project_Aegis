// // src/components/SplashScreen.jsx
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// export default function SplashScreen() {
//   const navigate = useNavigate();
//   const [animate, setAnimate] = useState(false);

//   useEffect(() => {
//     setAnimate(true);

//     const timer = setTimeout(() => {
//       navigate("/auth");
//     }, 2500);

//     return () => clearTimeout(timer);
//   }, [navigate]);

//   return (
//     <div style={styles.container}>
//       <div
//         style={{
//           ...styles.logo,
//           transform: animate ? "scale(1)" : "scale(0)",
//           opacity: animate ? 1 : 0,
//           transition: "all 1.5s ease-in-out",
//         }}
//       >
//         🚨
//       </div>
//       <h1 style={styles.title}>Disaster Response PWA</h1>
//       <p style={styles.subtitle}>Stay ready. Stay safe.</p>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     minHeight: "100vh",
//     display: "flex",
//     flexDirection: "column",
//     justifyContent: "center",
//     alignItems: "center",
//     background: "linear-gradient(135deg, #8B1E3F, #F7C1A1)",
//     color: "#fff",
//     fontFamily: "Arial, sans-serif",
//     gap: "15px",
//   },
//   logo: { fontSize: "80px" },
//   title: { fontSize: "28px", fontWeight: "bold" },
//   subtitle: { fontSize: "16px" },
// };
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
    <div style={styles.screen}>
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
        <h1
          style={{
            ...styles.title,
            transform: animate ? "translateY(0)" : "translateY(20px)",
            opacity: animate ? 1 : 0,
            transition: "all 1.5s ease-in-out",
          }}
        >
          Disaster Response PWA
        </h1>
        <p
          style={{
            ...styles.subtitle,
            transform: animate ? "translateY(0)" : "translateY(20px)",
            opacity: animate ? 1 : 0,
            transition: "all 1.5s ease-in-out 0.3s",
          }}
        >
          Stay ready. Stay safe.
        </p>
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
    padding: "clamp(0.75rem, 3vw, 1rem)",
    background: "linear-gradient(135deg, #8B2E2E, #3a0d0d)",
    fontFamily: "'Roboto', sans-serif",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "1.5rem",
    width: "100%",
    maxWidth: "450px",
    padding: "clamp(1rem, 5vw, 2rem)",
  },
  logo: {
    fontSize: "clamp(80px, 20vw, 150px)", // responsive and bigger
    textShadow: "0 0 15px #000, 0 0 25px rgba(0,0,0,0.5)",
  },
  title: {
    fontSize: "clamp(1.5rem, 5vw, 2.5rem)", // responsive font
    fontWeight: "700",
    color: "#F5D0C5",
    letterSpacing: "-0.02em",
    textShadow: "0 0 5px #000",
  },
  subtitle: {
    fontSize: "clamp(0.875rem, 3vw, 1.25rem)", // responsive font
    color: "#FFDAB9",
    opacity: 0.9,
  },
};
