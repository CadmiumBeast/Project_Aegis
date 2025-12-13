import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {isLogin ? (
          <Login switchToSignup={() => setIsLogin(false)} />
        ) : (
          <Signup switchToLogin={() => setIsLogin(true)} />
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
