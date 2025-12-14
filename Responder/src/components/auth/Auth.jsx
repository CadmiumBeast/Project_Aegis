import { useState, useEffect } from "react";
import Login from "./Login";
import Signup from "./Signup";
import ResponderForm from "../responder/ResponderForm";
import { auth } from "../../firebase";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #8B2E2E 0%, #A03A3A 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      width: "100%",
      maxWidth: "380px",
      textAlign: "center",
      position: "relative",
    },
    loading: {
      color: "#8B2E2E",
      fontSize: "18px",
      fontWeight: "600",
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.loading}>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <ResponderForm />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {isLogin ? (
          <Login
            switchToSignup={() => setIsLogin(false)}
            onSuccess={() => setIsAuthenticated(true)}
          />
        ) : (
          <Signup
            switchToLogin={() => setIsLogin(true)}
            onSuccess={() => setIsAuthenticated(true)}
          />
        )}
      </div>
    </div>
  );
}

export default Auth;
