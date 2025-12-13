

import { useState, useEffect } from "react";
import Login from "./Login";
import Signup from "./Signup";
import ResponderForm from "../responder/ResponderForm";
import { auth } from "../../firebase";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Detect system theme preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDark);

    // Listen for changes in system theme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Check if user is already logged in on component mount
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true);
        console.log("User is logged in:", user);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStyles = () => {
    if (isDarkMode) {
      return {
        container: {
          height: "100vh",
          background: "linear-gradient(135deg, #1a1a1a, #2d2d2d)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        card: {
          backgroundColor: "#1f1f1f",
          // padding: "40px",
          // width: "380px",
          // borderRadius: "16px",
          textAlign: "center",
          boxShadow: "0 15px 30px rgba(0,0,0,0.5)",
          position: "relative",
        },
      };
    }
    return {
      container: {
        // height: "100vh",
        background: "linear-gradient(135deg, #8B2E2E 0%, #A03A3A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      card: {
        // padding: "40px",
        width: "380px",
        textAlign: "center",
        position: "relative",
      },
    };
  };

  const currentStyles = getStyles();

  if (loading) {
    return (
      <div style={currentStyles.container}>
        <div style={currentStyles.card}>
          <p style={{ color: isDarkMode ? "#FF6B9D" : "#8B1E3F", fontSize: "18px" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <ResponderForm />;
  }

  return (
    <div style={currentStyles.container}>
      <div style={currentStyles.card}>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            padding: "8px",
          }}
          title="Toggle dark mode"
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
        {isLogin ? (
          <Login
            switchToSignup={() => setIsLogin(false)}
            onSuccess={() => setIsAuthenticated(true)}
            isDarkMode={isDarkMode}
          />
        ) : (
          <Signup
            switchToLogin={() => setIsLogin(true)}
            onSuccess={() => setIsAuthenticated(true)}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
}

export default Auth;
