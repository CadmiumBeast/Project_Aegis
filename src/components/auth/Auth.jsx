

// export default Auth;


import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import ResponderForm from "../responder/ResponderForm";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

const styles = {
  container: {
    height: "100vh",
    background: "linear-gradient(135deg, #8B1E3F, #F7C1A1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFF3EC",
    padding: "40px",
    width: "380px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 15px 30px rgba(0,0,0,0.2)",
  },
};

export default Auth;
