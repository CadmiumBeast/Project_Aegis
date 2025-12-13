

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/auth/Auth";
import ResponderForm from "./components/responder/ResponderForm";
import PastReports from "./components/responder/PastReports";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/responder-form" element={<ResponderForm />} />
        <Route path="/past-reports" element={<PastReports />} />
      </Routes>
    </Router>
  );
}

export default App;
